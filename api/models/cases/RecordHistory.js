const mongoose = require("mongoose");

const RecordHistorySchema = new mongoose.Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Record",
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ["created", "updated", "deleted"],
    required: true,
  },
  changedBy: {
    type: String,
    default: "unknown",
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RecordHistory", RecordHistorySchema);
