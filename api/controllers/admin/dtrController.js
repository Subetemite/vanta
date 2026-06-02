const Employee = require("../../models/admin/Employee");
const TimeLog = require("../../models/admin/TimeLog");
const LeaveRequest = require("../../models/admin/LeaveRequest");
const SpecialOrder = require("../../models/admin/SpecialOrder");
const OfficialOperation = require("../../models/admin/OfficialOperation");

const LEAVE_TYPES = LeaveRequest.LEAVE_TYPES;
const LEAVE_STATUS = LeaveRequest.LEAVE_STATUS;

function fullName(emp) {
  return [emp.firstName, emp.middleName, emp.lastName, emp.suffix].filter(Boolean).join(" ");
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

function startOfDayUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function combineDateAndTime(dayDate, timeStr) {
  if (!dayDate || !timeStr) return null;
  const [hh, mm] = String(timeStr).split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date(dayDate);
  d.setUTCHours(hh, mm, 0, 0);
  return d;
}

function diffHours(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
}

function computeDayTotal(amIn, amOut, pmIn, pmOut) {
  return Number((diffHours(amIn, amOut) + diffHours(pmIn, pmOut)).toFixed(2));
}

async function snapshotEmployee(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;
  return {
    employee: employee._id,
    employeeIdSnapshot: employee.employeeId,
    employeeNameSnapshot: fullName(employee),
    fullNameSnapshot: fullName(employee),
  };
}

exports.getMeta = async (_req, res) => {
  return res.status(200).json({ leaveTypes: LEAVE_TYPES, leaveStatus: LEAVE_STATUS });
};

/* ============================================================
 * TIME LOGS
 * ============================================================ */
function toTimeLog(log) {
  return {
    id: log._id,
    employee: log.employee,
    employeeId: log.employeeIdSnapshot,
    employeeName: log.employeeNameSnapshot,
    date: log.date,
    amIn: log.amIn,
    amOut: log.amOut,
    pmIn: log.pmIn,
    pmOut: log.pmOut,
    totalHours: log.totalHours,
    remarks: log.remarks,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

exports.listTimeLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = startOfDayUTC(req.query.from);
      if (req.query.to) filter.date.$lte = startOfDayUTC(req.query.to);
    }
    const logs = await TimeLog.find(filter).sort({ date: -1 }).limit(500);
    return res.status(200).json({ logs: logs.map(toTimeLog) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load time logs.", error: error.message });
  }
};

exports.createTimeLog = async (req, res) => {
  try {
    const snap = await snapshotEmployee(req.body.employee);
    if (!snap) return res.status(404).json({ message: "Employee not found." });

    const dayDate = startOfDayUTC(req.body.date);
    if (!dayDate) return res.status(400).json({ message: "A valid date is required." });

    const amIn = combineDateAndTime(dayDate, req.body.amIn);
    const amOut = combineDateAndTime(dayDate, req.body.amOut);
    const pmIn = combineDateAndTime(dayDate, req.body.pmIn);
    const pmOut = combineDateAndTime(dayDate, req.body.pmOut);

    const existing = await TimeLog.findOne({ employee: snap.employee, date: dayDate });
    if (existing) {
      return res.status(409).json({
        message: "A time log already exists for this employee on this date. Edit it instead.",
      });
    }

    const log = await TimeLog.create({
      employee: snap.employee,
      employeeIdSnapshot: snap.employeeIdSnapshot,
      employeeNameSnapshot: snap.employeeNameSnapshot,
      date: dayDate,
      amIn,
      amOut,
      pmIn,
      pmOut,
      totalHours: computeDayTotal(amIn, amOut, pmIn, pmOut),
      remarks: String(req.body.remarks || "").trim(),
    });

    return res.status(201).json({ message: "Time log created.", log: toTimeLog(log) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create time log.", error: error.message });
  }
};

exports.updateTimeLog = async (req, res) => {
  try {
    const log = await TimeLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Time log not found." });

    if (req.body.employee && String(req.body.employee) !== String(log.employee)) {
      const snap = await snapshotEmployee(req.body.employee);
      if (!snap) return res.status(404).json({ message: "Employee not found." });
      log.employee = snap.employee;
      log.employeeIdSnapshot = snap.employeeIdSnapshot;
      log.employeeNameSnapshot = snap.employeeNameSnapshot;
    }

    const dayDate = startOfDayUTC(req.body.date) || log.date;
    log.date = dayDate;
    log.amIn = combineDateAndTime(dayDate, req.body.amIn);
    log.amOut = combineDateAndTime(dayDate, req.body.amOut);
    log.pmIn = combineDateAndTime(dayDate, req.body.pmIn);
    log.pmOut = combineDateAndTime(dayDate, req.body.pmOut);
    log.totalHours = computeDayTotal(log.amIn, log.amOut, log.pmIn, log.pmOut);
    log.remarks = String(req.body.remarks || "").trim();

    await log.save();
    return res.status(200).json({ message: "Time log updated.", log: toTimeLog(log) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update time log.", error: error.message });
  }
};

exports.deleteTimeLog = async (req, res) => {
  try {
    const removed = await TimeLog.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Time log not found." });
    return res.status(200).json({ message: "Time log deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete time log.", error: error.message });
  }
};

/* ============================================================
 * LEAVE REQUESTS
 * ============================================================ */
function toLeave(leave) {
  return {
    id: leave._id,
    employee: leave.employee,
    employeeId: leave.employeeIdSnapshot,
    employeeName: leave.employeeNameSnapshot,
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    numberOfDays: leave.numberOfDays,
    reason: leave.reason,
    status: leave.status,
    attachedFile: leave.attachedFile,
    createdAt: leave.createdAt,
    updatedAt: leave.updatedAt,
  };
}

function inclusiveDays(start, end) {
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

exports.listLeaves = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.status) filter.status = req.query.status;
    const leaves = await LeaveRequest.find(filter).sort({ startDate: -1 }).limit(500);
    return res.status(200).json({ leaves: leaves.map(toLeave) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load leaves.", error: error.message });
  }
};

async function buildLeaveFromBody(body) {
  const snap = await snapshotEmployee(body.employee);
  if (!snap) throw Object.assign(new Error("Employee not found."), { status: 404 });

  if (!LEAVE_TYPES.includes(body.leaveType)) {
    throw Object.assign(new Error("A valid leave type is required."), { status: 400 });
  }

  const startDate = startOfDayUTC(body.startDate);
  const endDate = startOfDayUTC(body.endDate);
  if (!startDate || !endDate) {
    throw Object.assign(new Error("Start date and end date are required."), { status: 400 });
  }
  if (endDate < startDate) {
    throw Object.assign(new Error("End date must be on or after start date."), { status: 400 });
  }

  return {
    employee: snap.employee,
    employeeIdSnapshot: snap.employeeIdSnapshot,
    employeeNameSnapshot: snap.employeeNameSnapshot,
    leaveType: body.leaveType,
    startDate,
    endDate,
    numberOfDays: inclusiveDays(startDate, endDate),
    reason: String(body.reason || "").trim(),
    status: LEAVE_STATUS.includes(body.status) ? body.status : "Pending",
    attachedFile: attachedFileFromBody(body.attachedFile) || undefined,
  };
}

exports.createLeave = async (req, res) => {
  try {
    const fields = await buildLeaveFromBody(req.body);
    const leave = await LeaveRequest.create(fields);
    return res.status(201).json({ message: "Leave created.", leave: toLeave(leave) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found." });
    const fields = await buildLeaveFromBody(req.body);
    Object.assign(leave, fields);
    if (req.body.attachedFile === null) leave.attachedFile = undefined;
    await leave.save();
    return res.status(200).json({ message: "Leave updated.", leave: toLeave(leave) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const removed = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Leave not found." });
    return res.status(200).json({ message: "Leave deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete leave.", error: error.message });
  }
};

/* ============================================================
 * SPECIAL ORDERS / OFFICIAL OPERATIONS — shared shape
 * ============================================================ */
async function snapshotAssignees(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const ids = items.map((a) => a?.employee).filter(Boolean);
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
        role: String(a?.role || "").trim(),
      };
    })
    .filter(Boolean);
}

function toOrder(order) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    subject: order.subject,
    description: order.description,
    startDate: order.startDate,
    endDate: order.endDate,
    location: order.location,
    assignees: order.assignees,
    attachedFile: order.attachedFile,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

exports.listSpecialOrders = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { orderNumber: { $regex: query, $options: "i" } },
            { subject: { $regex: query, $options: "i" } },
            { "assignees.fullNameSnapshot": { $regex: query, $options: "i" } },
          ],
        }
      : {};
    const orders = await SpecialOrder.find(filter).sort({ startDate: -1 }).limit(500);
    return res.status(200).json({ orders: orders.map(toOrder) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load special orders.", error: error.message });
  }
};

exports.createSpecialOrder = async (req, res) => {
  try {
    const orderNumber = String(req.body.orderNumber || "").trim();
    const subject = String(req.body.subject || "").trim();
    if (!orderNumber) return res.status(400).json({ message: "Order number is required." });
    if (!subject) return res.status(400).json({ message: "Subject is required." });

    const startDate = startOfDayUTC(req.body.startDate);
    const endDate = startOfDayUTC(req.body.endDate);
    if (!startDate || !endDate) return res.status(400).json({ message: "Start and end dates are required." });
    if (endDate < startDate) return res.status(400).json({ message: "End date must be on or after start date." });

    const existing = await SpecialOrder.findOne({ orderNumber }).select("_id");
    if (existing) {
      return res.status(409).json({ message: `Order number "${orderNumber}" already exists.` });
    }

    const assignees = await snapshotAssignees(req.body.assignees);

    const order = await SpecialOrder.create({
      orderNumber,
      subject,
      description: String(req.body.description || "").trim(),
      startDate,
      endDate,
      location: String(req.body.location || "").trim(),
      assignees,
      attachedFile: attachedFileFromBody(req.body.attachedFile) || undefined,
    });

    return res.status(201).json({ message: "Special order created.", order: toOrder(order) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create special order.", error: error.message });
  }
};

exports.updateSpecialOrder = async (req, res) => {
  try {
    const order = await SpecialOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Special order not found." });

    const orderNumber = String(req.body.orderNumber || "").trim();
    if (!orderNumber) return res.status(400).json({ message: "Order number is required." });
    if (orderNumber !== order.orderNumber) {
      const clash = await SpecialOrder.findOne({ orderNumber, _id: { $ne: order._id } }).select("_id");
      if (clash) return res.status(409).json({ message: `Order number "${orderNumber}" already exists.` });
    }

    const startDate = startOfDayUTC(req.body.startDate) || order.startDate;
    const endDate = startOfDayUTC(req.body.endDate) || order.endDate;
    if (endDate < startDate) return res.status(400).json({ message: "End date must be on or after start date." });

    order.orderNumber = orderNumber;
    order.subject = String(req.body.subject || "").trim();
    order.description = String(req.body.description || "").trim();
    order.startDate = startDate;
    order.endDate = endDate;
    order.location = String(req.body.location || "").trim();
    order.assignees = await snapshotAssignees(req.body.assignees);
    if (req.body.attachedFile && req.body.attachedFile.id) {
      order.attachedFile = attachedFileFromBody(req.body.attachedFile);
    } else if (req.body.attachedFile === null) {
      order.attachedFile = undefined;
    }

    await order.save();
    return res.status(200).json({ message: "Special order updated.", order: toOrder(order) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update special order.", error: error.message });
  }
};

exports.deleteSpecialOrder = async (req, res) => {
  try {
    const removed = await SpecialOrder.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Special order not found." });
    return res.status(200).json({ message: "Special order deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete special order.", error: error.message });
  }
};

/* ============================================================
 * OFFICIAL OPERATIONS
 * ============================================================ */
function toOperation(op) {
  return {
    id: op._id,
    operationName: op.operationName,
    referenceOrder: op.referenceOrder,
    description: op.description,
    startDate: op.startDate,
    endDate: op.endDate,
    location: op.location,
    assignees: op.assignees,
    attachedFile: op.attachedFile,
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  };
}

exports.listOperations = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { operationName: { $regex: query, $options: "i" } },
            { referenceOrder: { $regex: query, $options: "i" } },
            { "assignees.fullNameSnapshot": { $regex: query, $options: "i" } },
          ],
        }
      : {};
    const ops = await OfficialOperation.find(filter).sort({ startDate: -1 }).limit(500);
    return res.status(200).json({ operations: ops.map(toOperation) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load operations.", error: error.message });
  }
};

exports.createOperation = async (req, res) => {
  try {
    const operationName = String(req.body.operationName || "").trim();
    if (!operationName) return res.status(400).json({ message: "Operation name is required." });

    const startDate = startOfDayUTC(req.body.startDate);
    const endDate = startOfDayUTC(req.body.endDate);
    if (!startDate || !endDate) return res.status(400).json({ message: "Start and end dates are required." });
    if (endDate < startDate) return res.status(400).json({ message: "End date must be on or after start date." });

    const op = await OfficialOperation.create({
      operationName,
      referenceOrder: String(req.body.referenceOrder || "").trim(),
      description: String(req.body.description || "").trim(),
      startDate,
      endDate,
      location: String(req.body.location || "").trim(),
      assignees: await snapshotAssignees(req.body.assignees),
      attachedFile: attachedFileFromBody(req.body.attachedFile) || undefined,
    });

    return res.status(201).json({ message: "Operation created.", operation: toOperation(op) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create operation.", error: error.message });
  }
};

exports.updateOperation = async (req, res) => {
  try {
    const op = await OfficialOperation.findById(req.params.id);
    if (!op) return res.status(404).json({ message: "Operation not found." });

    const operationName = String(req.body.operationName || "").trim();
    if (!operationName) return res.status(400).json({ message: "Operation name is required." });

    const startDate = startOfDayUTC(req.body.startDate) || op.startDate;
    const endDate = startOfDayUTC(req.body.endDate) || op.endDate;
    if (endDate < startDate) return res.status(400).json({ message: "End date must be on or after start date." });

    op.operationName = operationName;
    op.referenceOrder = String(req.body.referenceOrder || "").trim();
    op.description = String(req.body.description || "").trim();
    op.startDate = startDate;
    op.endDate = endDate;
    op.location = String(req.body.location || "").trim();
    op.assignees = await snapshotAssignees(req.body.assignees);
    if (req.body.attachedFile && req.body.attachedFile.id) {
      op.attachedFile = attachedFileFromBody(req.body.attachedFile);
    } else if (req.body.attachedFile === null) {
      op.attachedFile = undefined;
    }

    await op.save();
    return res.status(200).json({ message: "Operation updated.", operation: toOperation(op) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update operation.", error: error.message });
  }
};

exports.deleteOperation = async (req, res) => {
  try {
    const removed = await OfficialOperation.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Operation not found." });
    return res.status(200).json({ message: "Operation deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete operation.", error: error.message });
  }
};
