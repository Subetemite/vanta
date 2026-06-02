const Deployment = require("../../models/operations/Deployment");
const Mission = require("../../models/operations/Mission");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.mission) filter.mission = req.query.mission;
    if (req.query.status) filter.status = req.query.status;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { "personnel.name": rx },
        { "personnel.rank": rx },
        { "personnel.unit": rx },
        { missionCodeName: rx },
        { vehiclePlate: rx },
        { deploymentLocation: rx },
        { role: rx },
      ];
    }
    const deployments = await Deployment.find(filter).sort({ createdAt: -1 });
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: "Unable to load deployments." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.mission) return res.status(400).json({ message: "Mission is required." });
    if (!req.body.personnel?.name?.trim()) return res.status(400).json({ message: "Personnel name is required." });
    if (!req.body.missionCodeName) {
      const m = await Mission.findById(req.body.mission).select("codeName");
      if (m) req.body.missionCodeName = m.codeName;
    }
    const deployment = await Deployment.create(req.body);
    res.status(201).json({ message: "Deployment created.", deployment });
  } catch (error) {
    res.status(500).json({ message: "Unable to create deployment." });
  }
};

exports.update = async (req, res) => {
  try {
    const deployment = await Deployment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!deployment) return res.status(404).json({ message: "Deployment not found." });
    res.json({ message: "Deployment updated.", deployment });
  } catch (error) {
    res.status(500).json({ message: "Unable to update deployment." });
  }
};

exports.remove = async (req, res) => {
  try {
    const deployment = await Deployment.findByIdAndDelete(req.params.id);
    if (!deployment) return res.status(404).json({ message: "Deployment not found." });
    res.json({ message: "Deployment deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete deployment." });
  }
};

exports.markDeployed = async (req, res) => {
  try {
    const deployment = await Deployment.findByIdAndUpdate(
      req.params.id,
      { status: "deployed", deployedAt: new Date() },
      { new: true }
    );
    if (!deployment) return res.status(404).json({ message: "Deployment not found." });
    res.json({ message: "Marked deployed.", deployment });
  } catch (error) {
    res.status(500).json({ message: "Unable to update deployment." });
  }
};

exports.markReturned = async (req, res) => {
  try {
    const deployment = await Deployment.findByIdAndUpdate(
      req.params.id,
      { status: "returned", returnedAt: new Date() },
      { new: true }
    );
    if (!deployment) return res.status(404).json({ message: "Deployment not found." });
    res.json({ message: "Marked returned.", deployment });
  } catch (error) {
    res.status(500).json({ message: "Unable to update deployment." });
  }
};
