const SocialAccount = require("../../models/social/SocialAccount");
const SocialPost = require("../../models/social/SocialPost");
const SocialAlert = require("../../models/social/SocialAlert");
const SocialCampaign = require("../../models/social/SocialCampaign");

exports.overview = async (req, res) => {
  try {
    const [
      accountsByPlatform,
      accountsByStatus,
      postsBySentiment,
      alertsBySeverity,
      alertsByStatus,
      flaggedPosts,
      recentAlerts,
      activeCampaigns,
      totals,
    ] = await Promise.all([
      SocialAccount.aggregate([{ $group: { _id: "$platform", count: { $sum: 1 } } }]),
      SocialAccount.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      SocialPost.aggregate([{ $group: { _id: "$sentiment", count: { $sum: 1 } } }]),
      SocialAlert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      SocialAlert.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      SocialPost.find({ flagged: true }).sort({ capturedAt: -1 }).limit(8),
      SocialAlert.find().sort({ detectedAt: -1 }).limit(8),
      SocialCampaign.find({ status: "active" }).sort({ updatedAt: -1 }).limit(6),
      Promise.all([
        SocialAccount.countDocuments(),
        SocialPost.countDocuments(),
        SocialAlert.countDocuments(),
        SocialCampaign.countDocuments(),
      ]),
    ]);

    res.json({
      accounts: { total: totals[0], byPlatform: accountsByPlatform, byStatus: accountsByStatus },
      posts: { total: totals[1], bySentiment: postsBySentiment, flagged: flaggedPosts, flaggedCount: flaggedPosts.length },
      alerts: {
        total: totals[2],
        bySeverity: alertsBySeverity,
        byStatus: alertsByStatus,
        recent: recentAlerts,
        criticalCount: alertsBySeverity.find((s) => s._id === "critical")?.count || 0,
        newCount: alertsByStatus.find((s) => s._id === "new")?.count || 0,
      },
      campaigns: { total: totals[3], active: activeCampaigns, activeCount: activeCampaigns.length },
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to compute social overview." });
  }
};
