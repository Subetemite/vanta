const Activity = require("../../models/admin/Activity");
const Employee = require("../../models/admin/Employee");
const LeaveRequest = require("../../models/admin/LeaveRequest");
const SpecialOrder = require("../../models/admin/SpecialOrder");
const OfficialOperation = require("../../models/admin/OfficialOperation");

const ACTIVITY_TYPES = Activity.ACTIVITY_TYPES;

function fullName(emp) {
  return [emp.firstName, emp.middleName, emp.lastName, emp.suffix].filter(Boolean).join(" ");
}

function startOfDayUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDayUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function attachedFileFromBody(body) {
  if (!body || !body.id) return null;
  return {
    id: body.id,
    originalName: String(body.originalName || "").trim(),
    url: String(body.url || "").trim(),
    mimeType: String(body.mimeType || "").trim(),
    size: Number(body.size) || 0,
  };
}

async function snapshotAttendees(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const ids = items.map((a) => a?.employee).filter(Boolean);
  if (!ids.length) return [];
  const employees = await Employee.find({ _id: { $in: ids } });
  const map = new Map(employees.map((e) => [String(e._id), e]));
  return items
    .map((a) => {
      const emp = map.get(String(a?.employee));
      if (!emp) return null;
      return {
        employee: emp._id,
        employeeIdSnapshot: emp.employeeId,
        fullNameSnapshot: fullName(emp),
      };
    })
    .filter(Boolean);
}

function toActivity(a) {
  return {
    id: a._id,
    title: a.title,
    type: a.type,
    startDate: a.startDate,
    endDate: a.endDate,
    startTime: a.startTime,
    endTime: a.endTime,
    location: a.location,
    description: a.description,
    attendees: a.attendees,
    attachedFile: a.attachedFile,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

exports.getMeta = async (_req, res) => {
  return res.status(200).json({ activityTypes: ACTIVITY_TYPES });
};

exports.listActivities = async (_req, res) => {
  try {
    const activities = await Activity.find().sort({ startDate: -1 }).limit(500);
    return res.status(200).json({ activities: activities.map(toActivity) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load activities.", error: error.message });
  }
};

async function buildActivityFromBody(body) {
  const title = String(body.title || "").trim();
  if (!title) {
    throw Object.assign(new Error("Title is required."), { status: 400 });
  }

  const startDate = startOfDayUTC(body.startDate);
  const endDate = startOfDayUTC(body.endDate);
  if (!startDate || !endDate) {
    throw Object.assign(new Error("Start and end dates are required."), { status: 400 });
  }
  if (endDate < startDate) {
    throw Object.assign(new Error("End date must be on or after start date."), { status: 400 });
  }

  const type = ACTIVITY_TYPES.includes(body.type) ? body.type : "Meeting";

  return {
    title,
    type,
    startDate,
    endDate,
    startTime: String(body.startTime || "").trim(),
    endTime: String(body.endTime || "").trim(),
    location: String(body.location || "").trim(),
    description: String(body.description || "").trim(),
    attendees: await snapshotAttendees(body.attendees),
    attachedFile: attachedFileFromBody(body.attachedFile) || undefined,
  };
}

exports.createActivity = async (req, res) => {
  try {
    const fields = await buildActivityFromBody(req.body);
    const activity = await Activity.create(fields);
    return res.status(201).json({ message: "Activity created.", activity: toActivity(activity) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: "Activity not found." });

    const fields = await buildActivityFromBody(req.body);
    Object.assign(activity, fields);
    if (req.body.attachedFile === null) activity.attachedFile = undefined;

    await activity.save();
    return res.status(200).json({ message: "Activity updated.", activity: toActivity(activity) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const removed = await Activity.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Activity not found." });
    return res.status(200).json({ message: "Activity deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete activity.", error: error.message });
  }
};

/* Aggregated calendar feed across activities + leaves + special orders + operations. */
exports.getFeed = async (req, res) => {
  try {
    const from = startOfDayUTC(req.query.from);
    const to = endOfDayUTC(req.query.to);
    if (!from || !to) {
      return res.status(400).json({ message: "from and to dates are required." });
    }

    const employeeFilter = req.query.employee ? String(req.query.employee) : null;
    const overlapFilter = { startDate: { $lte: to }, endDate: { $gte: from } };

    const activityFilter = { ...overlapFilter };
    if (employeeFilter) activityFilter["attendees.employee"] = employeeFilter;

    const leaveFilter = { ...overlapFilter };
    if (employeeFilter) leaveFilter.employee = employeeFilter;

    const orderFilter = { ...overlapFilter };
    if (employeeFilter) orderFilter["assignees.employee"] = employeeFilter;

    const opFilter = { ...overlapFilter };
    if (employeeFilter) opFilter["assignees.employee"] = employeeFilter;

    const [activities, leaves, orders, ops] = await Promise.all([
      Activity.find(activityFilter).sort({ startDate: 1 }).limit(1000),
      LeaveRequest.find(leaveFilter).sort({ startDate: 1 }).limit(1000),
      SpecialOrder.find(orderFilter).sort({ startDate: 1 }).limit(1000),
      OfficialOperation.find(opFilter).sort({ startDate: 1 }).limit(1000),
    ]);

    const events = [];

    for (const a of activities) {
      events.push({
        id: a._id,
        source: "activity",
        title: a.title,
        type: a.type,
        startDate: a.startDate,
        endDate: a.endDate,
        startTime: a.startTime,
        endTime: a.endTime,
        location: a.location,
        attendees: a.attendees.map((x) => ({
          employee: x.employee,
          employeeId: x.employeeIdSnapshot,
          fullName: x.fullNameSnapshot,
        })),
      });
    }

    for (const l of leaves) {
      events.push({
        id: l._id,
        source: "leave",
        title: `${l.leaveType}`,
        type: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        location: "",
        attendees: [
          {
            employee: l.employee,
            employeeId: l.employeeIdSnapshot,
            fullName: l.employeeNameSnapshot,
          },
        ],
      });
    }

    for (const o of orders) {
      events.push({
        id: o._id,
        source: "special-order",
        title: `${o.orderNumber} — ${o.subject}`,
        type: "Special Order",
        startDate: o.startDate,
        endDate: o.endDate,
        location: o.location,
        attendees: o.assignees.map((x) => ({
          employee: x.employee,
          employeeId: x.employeeIdSnapshot,
          fullName: x.fullNameSnapshot,
        })),
      });
    }

    for (const op of ops) {
      events.push({
        id: op._id,
        source: "operation",
        title: op.operationName,
        type: "Operation",
        startDate: op.startDate,
        endDate: op.endDate,
        location: op.location,
        attendees: op.assignees.map((x) => ({
          employee: x.employee,
          employeeId: x.employeeIdSnapshot,
          fullName: x.fullNameSnapshot,
        })),
      });
    }

    return res.status(200).json({ from, to, events });
  } catch (error) {
    return res.status(500).json({ message: "Unable to build calendar feed.", error: error.message });
  }
};
