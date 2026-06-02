const mongoose = require("mongoose");

const OUTCOMES = ["success", "partial-success", "inconclusive", "failed"];

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const AfterActionSchema = new mongoose.Schema(
  {
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true, unique: true, index: true },
    missionCodeName: { type: String, trim: true, default: "" },
    outcome: { type: String, enum: OUTCOMES, default: "inconclusive", index: true },
    summary: { type: String, trim: true, default: "" },
    objectivesMet: { type: String, trim: true, default: "" },
    objectivesMissed: { type: String, trim: true, default: "" },
    successes: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    lessonsLearned: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    totalArrests: { type: Number, default: 0 },
    totalSeized: { type: String, trim: true, default: "" },
    casualties: {
      friendly: { type: Number, default: 0 },
      hostile: { type: Number, default: 0 },
      civilian: { type: Number, default: 0 },
    },
    preparedBy: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: Date.now },
    approvedBy: { type: String, trim: true, default: "" },
    approvedAt: { type: Date, default: null },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true }
);

AfterActionSchema.statics.OUTCOMES = OUTCOMES;

module.exports = mongoose.model("AfterAction", AfterActionSchema);
module.exports.OUTCOMES = OUTCOMES;
