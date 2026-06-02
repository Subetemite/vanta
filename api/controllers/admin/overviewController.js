const Employee = require("../../models/admin/Employee");
const HrisDocument = require("../../models/admin/HrisDocument");
const TimeLog = require("../../models/admin/TimeLog");
const LeaveRequest = require("../../models/admin/LeaveRequest");
const SpecialOrder = require("../../models/admin/SpecialOrder");
const OfficialOperation = require("../../models/admin/OfficialOperation");
const Activity = require("../../models/admin/Activity");
const Opcr = require("../../models/admin/Opcr");
const RoutingRecord = require("../../models/admin/RoutingRecord");

function startOfMonthUTC(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfDayUTC(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDayUTC(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildLastNMonths(n) {
  const today = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    months.push({ key: monthKey(d), date: d });
  }
  return months;
}

exports.getOverview = async (_req, res) => {
  try {
    const today = startOfDayUTC();
    const todayEnd = endOfDayUTC();
    const monthStart = startOfMonthUTC();
    const sixMonthsAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
    const weekFromNow = new Date(today.getTime() + 7 * 86400000);

    /* HRIS */
    const employees = await Employee.find().select("status department");
    const employeesByStatus = {};
    const employeesByDept = new Map();
    for (const e of employees) {
      employeesByStatus[e.status] = (employeesByStatus[e.status] || 0) + 1;
      const dept = e.department || "Unassigned";
      employeesByDept.set(dept, (employeesByDept.get(dept) || 0) + 1);
    }
    const totalDocuments201 = await HrisDocument.countDocuments();

    /* DTR */
    const timeLogsTotal = await TimeLog.countDocuments();
    const timeLogsThisMonth = await TimeLog.countDocuments({ date: { $gte: monthStart } });
    const leavesByStatusAgg = await LeaveRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const leavesByStatus = leavesByStatusAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});
    const leavesByTypeAgg = await LeaveRequest.aggregate([
      { $group: { _id: "$leaveType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const leavesByType = leavesByTypeAgg.map((r) => ({ type: r._id, count: r.count }));

    const onLeaveToday = await LeaveRequest.countDocuments({
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
      status: { $in: ["Pending", "Approved"] },
    });
    const activeSpecialOrders = await SpecialOrder.countDocuments({
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
    });
    const activeOperations = await OfficialOperation.countDocuments({
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
    });

    /* OPCR */
    const opcrTotal = await Opcr.countDocuments();
    const opcrByStatusAgg = await Opcr.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const opcrByStatus = opcrByStatusAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});
    const opcrAvgAgg = await Opcr.aggregate([
      { $match: { overallRating: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$overallRating" } } },
    ]);
    const opcrAvgRating = opcrAvgAgg[0]?.avg ? Number(opcrAvgAgg[0].avg.toFixed(2)) : 0;

    /* Documents Tracking */
    const docsTotal = await RoutingRecord.countDocuments();
    const docsThisMonth = await RoutingRecord.countDocuments({ createdAt: { $gte: monthStart } });
    const docsRecent = await RoutingRecord.find({ createdAt: { $gte: sixMonthsAgo } }).select("createdAt");
    const docsByMonthMap = new Map();
    for (const r of docsRecent) {
      const k = monthKey(new Date(r.createdAt));
      docsByMonthMap.set(k, (docsByMonthMap.get(k) || 0) + 1);
    }
    const docsByMonth = buildLastNMonths(6).map((m) => ({
      key: m.key,
      label: m.date.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" }),
      count: docsByMonthMap.get(m.key) || 0,
    }));

    /* Calendar / Activities */
    const upcomingActivities = await Activity.countDocuments({
      startDate: { $lte: weekFromNow },
      endDate: { $gte: today },
    });
    const activitiesByTypeAgg = await Activity.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    const activitiesByType = activitiesByTypeAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    return res.status(200).json({
      generatedAt: new Date(),
      hris: {
        totalEmployees: employees.length,
        byStatus: employeesByStatus,
        byDepartment: Array.from(employeesByDept.entries())
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        documentsTotal: totalDocuments201,
      },
      dtr: {
        timeLogsTotal,
        timeLogsThisMonth,
        leavesByStatus,
        leavesByType,
        onLeaveToday,
        activeSpecialOrders,
        activeOperations,
      },
      opcr: {
        total: opcrTotal,
        byStatus: opcrByStatus,
        avgOverallRating: opcrAvgRating,
      },
      documents: {
        total: docsTotal,
        thisMonth: docsThisMonth,
        byMonth: docsByMonth,
      },
      calendar: {
        upcomingWeek: upcomingActivities,
        byType: activitiesByType,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load overview.",
      error: error.message,
    });
  }
};
