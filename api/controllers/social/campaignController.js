const SocialCampaign = require("../../models/social/SocialCampaign");

function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { objective: rx }, { keywords: rx }, { hashtags: rx }, { leadAnalyst: rx }];
    }
    const campaigns = await SocialCampaign.find(filter).sort({ updatedAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Unable to load campaigns." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: "Campaign name is required." });
    const campaign = await SocialCampaign.create({ ...req.body, createdBy: req.user?.sub || null });
    res.status(201).json({ message: "Campaign created.", campaign });
  } catch (error) {
    res.status(500).json({ message: "Unable to create campaign." });
  }
};

exports.update = async (req, res) => {
  try {
    const campaign = await SocialCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });
    res.json({ message: "Campaign updated.", campaign });
  } catch (error) {
    res.status(500).json({ message: "Unable to update campaign." });
  }
};

exports.remove = async (req, res) => {
  try {
    const campaign = await SocialCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });
    res.json({ message: "Campaign deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete campaign." });
  }
};
