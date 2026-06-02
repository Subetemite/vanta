const Mission = require("../../models/operations/Mission");
const Deployment = require("../../models/operations/Deployment");
const Sitrep = require("../../models/operations/Sitrep");
const AfterAction = require("../../models/operations/AfterAction");

exports.overview = async (req, res) => {
  try {
    const [
      missionsByStatus,
      missionsByType,
      deploymentsByStatus,
      sitrepsByLevel,
      activeMissions,
      recentSitreps,
      pendingAARs,
    ] = await Promise.all([
      Mission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Mission.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Deployment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Sitrep.aggregate([{ $group: { _id: "$level", count: { $sum: 1 } } }]),
      Mission.find({ status: "active" }).sort({ actualStart: -1 }).limit(8),
      Sitrep.find().sort({ reportedAt: -1 }).limit(8),
      AfterAction.find({ approvedAt: null }).sort({ submittedAt: -1 }).limit(5),
    ]);

    const missionTotal = missionsByStatus.reduce((s, r) => s + r.count, 0);
    const deploymentTotal = deploymentsByStatus.reduce((s, r) => s + r.count, 0);
    const sitrepTotal = sitrepsByLevel.reduce((s, r) => s + r.count, 0);

    res.json({
      missions: {
        total: missionTotal,
        byStatus: missionsByStatus,
        byType: missionsByType,
        active: activeMissions,
        activeCount: missionsByStatus.find((s) => s._id === "active")?.count || 0,
      },
      deployments: {
        total: deploymentTotal,
        byStatus: deploymentsByStatus,
        deployedCount: deploymentsByStatus.find((s) => s._id === "deployed")?.count || 0,
      },
      sitreps: {
        total: sitrepTotal,
        byLevel: sitrepsByLevel,
        recent: recentSitreps,
        criticalCount: sitrepsByLevel.find((s) => s._id === "critical")?.count || 0,
      },
      afterAction: { pending: pendingAARs, pendingCount: pendingAARs.length },
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to compute operations overview." });
  }
};
