const AfterAction = require("../../models/operations/AfterAction");
const Mission = require("../../models/operations/Mission");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.mission) filter.mission = req.query.mission;
    if (req.query.outcome) filter.outcome = req.query.outcome;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ summary: rx }, { missionCodeName: rx }, { preparedBy: rx }];
    }
    const reports = await AfterAction.find(filter).sort({ submittedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Unable to load after-action reports." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.mission) return res.status(400).json({ message: "Mission is required." });
    if (!req.body.missionCodeName) {
      const m = await Mission.findById(req.body.mission).select("codeName");
      if (m) req.body.missionCodeName = m.codeName;
    }
    const report = await AfterAction.create(req.body);
    res.status(201).json({ message: "After-action report saved.", report });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "An AAR already exists for this mission." });
    res.status(500).json({ message: "Unable to save report." });
  }
};

exports.update = async (req, res) => {
  try {
    const report = await AfterAction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.json({ message: "Report updated.", report });
  } catch (error) {
    res.status(500).json({ message: "Unable to update report." });
  }
};

exports.remove = async (req, res) => {
  try {
    const report = await AfterAction.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.json({ message: "Report deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete report." });
  }
};

exports.approve = async (req, res) => {
  try {
    const approver = req.body.approvedBy || req.user?.username || "";
    const report = await AfterAction.findByIdAndUpdate(
      req.params.id,
      { approvedBy: approver, approvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.json({ message: "Report approved.", report });
  } catch (error) {
    res.status(500).json({ message: "Unable to approve report." });
  }
};
