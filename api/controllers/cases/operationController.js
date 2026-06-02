const Operation = require("../../models/cases/Operation");
const { toAIOperation } = require("../../utils/cases/aiTransformers");

exports.getOperations = async (req, res) => {
  try {
    const operations = await Operation.find().sort({ createdAt: -1 });
    res.json(operations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch operations right now." });
  }
};

exports.getAIOperations = async (req, res) => {
  try {
    const operations = await Operation.find().sort({ createdAt: -1 });
    res.json(operations.map(toAIOperation));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch AI-ready operations right now." });
  }
};

exports.createOperation = async (req, res) => {
  try {
    const {
      operationId,
      operationCodeName,
      operationType,
      objective,
      plannedDateTime,
      actualDateTime,
      fullAddress,
      cityDistrict,
      operationCommander,
      teamLeader,
    } = req.body;

    if (!operationId || !operationCodeName || !operationType) {
      return res.status(400).json({
        message:
          "Operation ID, operation code name, and operation type are required.",
      });
    }

    const operation = new Operation({
      operationId,
      operationCodeName,
      operationType,
      objective,
      plannedDateTime,
      actualDateTime,
      fullAddress,
      cityDistrict,
      operationCommander,
      teamLeader,
    });

    await operation.save();

    res.status(201).json({
      message: "Operation registration saved successfully.",
      operation,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to save the operation." });
  }
};

exports.updateOperation = async (req, res) => {
  try {
    const {
      operationId,
      operationCodeName,
      operationType,
      objective,
      plannedDateTime,
      actualDateTime,
      fullAddress,
      cityDistrict,
      operationCommander,
      teamLeader,
    } = req.body;

    if (!operationId || !operationCodeName || !operationType) {
      return res.status(400).json({
        message:
          "Operation ID, operation code name, and operation type are required.",
      });
    }

    const operation = await Operation.findByIdAndUpdate(
      req.params.id,
      {
        operationId,
        operationCodeName,
        operationType,
        objective,
        plannedDateTime,
        actualDateTime,
        fullAddress,
        cityDistrict,
        operationCommander,
        teamLeader,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!operation) {
      return res.status(404).json({ message: "Operation not found." });
    }

    res.json({
      message: "Operation updated successfully.",
      operation,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update the operation." });
  }
};
