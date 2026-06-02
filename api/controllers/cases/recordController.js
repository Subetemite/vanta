const Record = require("../../models/cases/Record");
const RecordHistory = require("../../models/cases/RecordHistory");
const { toAIRecord } = require("../../utils/cases/aiTransformers");

function computeChanges(oldRecord, newData) {
  const changes = {};
  const sections = ["personalInformation", "operationDetails", "biometrics"];
  for (const section of sections) {
    const oldSec = (oldRecord[section] || {}).toObject ? oldRecord[section].toObject() : (oldRecord[section] || {});
    const newSec = newData[section] || {};
    const allKeys = new Set([...Object.keys(oldSec), ...Object.keys(newSec)]);
    for (const key of allKeys) {
      const oldVal = String(oldSec[key] ?? "");
      const newVal = String(newSec[key] ?? "");
      if (oldVal !== newVal) {
        changes[`${section}.${key}`] = { from: oldSec[key] ?? null, to: newSec[key] ?? null };
      }
    }
  }
  return changes;
}

exports.getRecords = async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch records right now." });
  }
};

exports.getAIRecords = async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records.map(toAIRecord));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch AI-ready records right now." });
  }
};

exports.createRecord = async (req, res) => {
  try {
    const {
      personalInformation,
      operationDetails,
      biometrics,
      profilePhoto,
    } = req.body;

    if (!personalInformation?.name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const normalizedBiometrics = {
      ...biometrics,
      heightCm:
        biometrics?.heightCm === "" || biometrics?.heightCm == null
          ? null
          : Number(biometrics.heightCm),
      weightKg:
        biometrics?.weightKg === "" || biometrics?.weightKg == null
          ? null
          : Number(biometrics.weightKg),
    };

    const record = new Record({
      personalInformation,
      operationDetails,
      biometrics: normalizedBiometrics,
      profilePhoto,
    });

    await record.save();

    await RecordHistory.create({
      recordId: record._id,
      action: "created",
      changedBy: req.user?.username || "unknown",
    }).catch(() => {});

    res.status(201).json({
      message: "Registration saved successfully.",
      record,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to save the registration." });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const {
      personalInformation,
      operationDetails,
      biometrics,
      profilePhoto,
    } = req.body;

    if (!personalInformation?.name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const normalizedBiometrics = {
      ...biometrics,
      heightCm:
        biometrics?.heightCm === "" || biometrics?.heightCm == null
          ? null
          : Number(biometrics.heightCm),
      weightKg:
        biometrics?.weightKg === "" || biometrics?.weightKg == null
          ? null
          : Number(biometrics.weightKg),
    };

    const oldRecord = await Record.findById(req.params.id);
    if (!oldRecord) {
      return res.status(404).json({ message: "Record not found." });
    }

    const changes = computeChanges(oldRecord, { personalInformation, operationDetails, biometrics: normalizedBiometrics });

    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      {
        personalInformation,
        operationDetails,
        biometrics: normalizedBiometrics,
        profilePhoto,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await RecordHistory.create({
      recordId: req.params.id,
      action: "updated",
      changedBy: req.user?.username || "unknown",
      changes,
    }).catch(() => {});

    res.json({
      message: "Registration updated successfully.",
      record: updatedRecord,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update the registration." });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found." });
    }

    await RecordHistory.create({
      recordId: req.params.id,
      action: "deleted",
      changedBy: req.user?.username || "unknown",
    }).catch(() => {});

    res.json({ message: "Record deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete the record." });
  }
};

exports.getRecordHistory = async (req, res) => {
  try {
    const history = await RecordHistory.find({ recordId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch record history." });
  }
};
