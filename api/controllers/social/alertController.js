const SocialAlert = require("../../models/social/SocialAlert");

function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.platform) filter.platform = req.query.platform;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { description: rx }, { assignedTo: rx }, { tags: rx }];
    }
    const alerts = await SocialAlert.find(filter).sort({ detectedAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Unable to load alerts." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.title?.trim()) return res.status(400).json({ message: "Title is required." });
    const alert = await SocialAlert.create({ ...req.body, createdBy: req.user?.sub || null });
    res.status(201).json({ message: "Alert raised.", alert });
  } catch (error) {
    res.status(500).json({ message: "Unable to create alert." });
  }
};

exports.update = async (req, res) => {
  try {
    const alert = await SocialAlert.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json({ message: "Alert updated.", alert });
  } catch (error) {
    res.status(500).json({ message: "Unable to update alert." });
  }
};

exports.remove = async (req, res) => {
  try {
    const alert = await SocialAlert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json({ message: "Alert deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete alert." });
  }
};

exports.transition = async (req, res) => {
  try {
    const update = { status: req.body.status };
    if (req.body.assignedTo != null) update.assignedTo = req.body.assignedTo;
    if (req.body.resolution != null) update.resolution = req.body.resolution;
    if (["resolved", "false-positive", "dismissed"].includes(req.body.status)) {
      update.resolvedAt = new Date();
    }
    const alert = await SocialAlert.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json({ message: "Alert updated.", alert });
  } catch (error) {
    res.status(500).json({ message: "Unable to transition alert." });
  }
};
