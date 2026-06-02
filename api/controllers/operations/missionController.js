const Mission = require("../../models/operations/Mission");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function nextMissionId() {
  const year = new Date().getFullYear();
  const prefix = `MIS-${year}-`;
  const last = await Mission.findOne({ missionId: new RegExp(`^${prefix}`) })
    .sort({ missionId: -1 })
    .select("missionId");
  let n = 1;
  if (last?.missionId) {
    const tail = last.missionId.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!isNaN(parsed)) n = parsed + 1;
  }
  return `${prefix}${String(n).padStart(4, "0")}`;
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { codeName: rx }, { missionId: rx }, { objective: rx },
        { commander: rx }, { teamLeader: rx }, { location: rx }, { leadAgency: rx },
      ];
    }
    const missions = await Mission.find(filter).sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: "Unable to load missions." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch mission." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.codeName?.trim()) return res.status(400).json({ message: "Code name is required." });
    const missionId = req.body.missionId || (await nextMissionId());
    const mission = await Mission.create({
      ...req.body,
      missionId,
      createdBy: req.user?.sub || null,
    });
    res.status(201).json({ message: "Mission created.", mission });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Mission ID already in use." });
    res.status(500).json({ message: "Unable to create mission." });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.missionId;
    delete updates.createdBy;
    const mission = await Mission.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    res.json({ message: "Mission updated.", mission });
  } catch (error) {
    res.status(500).json({ message: "Unable to update mission." });
  }
};

exports.remove = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    res.json({ message: "Mission deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete mission." });
  }
};

exports.activate = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      { status: "active", actualStart: new Date() },
      { new: true }
    );
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    res.json({ message: "Mission activated.", mission });
  } catch (error) {
    res.status(500).json({ message: "Unable to activate mission." });
  }
};

exports.complete = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      { status: "completed", actualEnd: new Date() },
      { new: true }
    );
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    res.json({ message: "Mission completed.", mission });
  } catch (error) {
    res.status(500).json({ message: "Unable to complete mission." });
  }
};
