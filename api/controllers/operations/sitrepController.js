const Sitrep = require("../../models/operations/Sitrep");
const Mission = require("../../models/operations/Mission");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.mission) filter.mission = req.query.mission;
    if (req.query.level) filter.level = req.query.level;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: rx }, { summary: rx }, { details: rx },
        { reportedBy: rx }, { location: rx }, { missionCodeName: rx },
      ];
    }
    const sitreps = await Sitrep.find(filter).sort({ reportedAt: -1, createdAt: -1 });
    res.json(sitreps);
  } catch (error) {
    res.status(500).json({ message: "Unable to load SITREPs." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.title?.trim()) return res.status(400).json({ message: "Title is required." });
    if (!req.body.mission) return res.status(400).json({ message: "Mission is required." });
    if (!req.body.missionCodeName) {
      const m = await Mission.findById(req.body.mission).select("codeName");
      if (m) req.body.missionCodeName = m.codeName;
    }
    const sitrep = await Sitrep.create(req.body);
    res.status(201).json({ message: "SITREP saved.", sitrep });
  } catch (error) {
    res.status(500).json({ message: "Unable to save SITREP." });
  }
};

exports.update = async (req, res) => {
  try {
    const sitrep = await Sitrep.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sitrep) return res.status(404).json({ message: "SITREP not found." });
    res.json({ message: "SITREP updated.", sitrep });
  } catch (error) {
    res.status(500).json({ message: "Unable to update SITREP." });
  }
};

exports.remove = async (req, res) => {
  try {
    const sitrep = await Sitrep.findByIdAndDelete(req.params.id);
    if (!sitrep) return res.status(404).json({ message: "SITREP not found." });
    res.json({ message: "SITREP deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete SITREP." });
  }
};
