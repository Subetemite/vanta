const mongoose = require("mongoose");

const SITREP_LEVELS = ["routine", "advisory", "warning", "critical"];

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const SitrepSchema = new mongoose.Schema(
  {
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
    missionCodeName: { type: String, trim: true, default: "" },
    reportNo: { type: String, trim: true, default: "" },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    details: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    reportedBy: { type: String, trim: true, default: "" },
    reportedAt: { type: Date, default: Date.now },
    level: { type: String, enum: SITREP_LEVELS, default: "routine", index: true },
    casualties: {
      friendly: { type: Number, default: 0 },
      hostile: { type: Number, default: 0 },
      civilian: { type: Number, default: 0 },
    },
    arrests: { type: Number, default: 0 },
    seized: { type: String, trim: true, default: "" },
    attachments: { type: [AttachmentSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

SitrepSchema.statics.LEVELS = SITREP_LEVELS;

module.exports = mongoose.model("Sitrep", SitrepSchema);
module.exports.SITREP_LEVELS = SITREP_LEVELS;
