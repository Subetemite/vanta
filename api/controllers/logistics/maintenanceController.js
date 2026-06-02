const MaintenanceLog = require("../../models/logistics/MaintenanceLog");
const Vehicle = require("../../models/logistics/Vehicle");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.assetType) filter.assetType = req.query.assetType;
    if (req.query.type) filter.type = req.query.type;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ assetName: rx }, { description: rx }, { performedBy: rx }, { vendor: rx }];
    }
    const logs = await MaintenanceLog.find(filter).sort({ performedAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load maintenance logs." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found." });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch log." });
  }
};

exports.create = async (req, res) => {
  try {
    const log = await MaintenanceLog.create(req.body);

    // If vehicle, update lastServicedAt / nextServiceAt
    if (log.assetType === "vehicle" && log.assetRef) {
      await Vehicle.findByIdAndUpdate(log.assetRef, {
        lastServicedAt: log.performedAt || new Date(),
        nextServiceAt: log.nextDueAt || null,
      });
    }

    res.status(201).json({ message: "Maintenance log saved.", log });
  } catch (error) {
    res.status(500).json({ message: "Unable to save log." });
  }
};

exports.update = async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ message: "Log not found." });
    res.json({ message: "Log updated.", log });
  } catch (error) {
    res.status(500).json({ message: "Unable to update log." });
  }
};

exports.remove = async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found." });
    res.json({ message: "Log deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete log." });
  }
};
