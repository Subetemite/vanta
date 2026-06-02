const mongoose = require("mongoose");

const SEVERITIES = ["low", "medium", "high", "critical"];
const ALERT_STATUS = ["new", "investigating", "escalated", "resolved", "false-positive", "dismissed"];
const ALERT_TYPES = ["threat", "scam", "disinformation", "harassment", "trafficking", "extremism", "drug-related", "fraud", "other"];

const SocialAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ALERT_TYPES, default: "other", index: true },
    severity: { type: String, enum: SEVERITIES, default: "medium", index: true },
    status: { type: String, enum: ALERT_STATUS, default: "new", index: true },
    description: { type: String, trim: true, default: "" },
    sourcePost: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", default: null },
    sourceAccount: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount", default: null },
    sourceUrl: { type: String, trim: true, default: "" },
    platform: { type: String, trim: true, default: "" },
    detectedAt: { type: Date, default: Date.now },
    assignedTo: { type: String, trim: true, default: "" },
    resolution: { type: String, trim: true, default: "" },
    resolvedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    relatedCaseEntry: { type: mongoose.Schema.Types.ObjectId, ref: "CaseEntry", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SocialAlertSchema.statics.SEVERITIES = SEVERITIES;
SocialAlertSchema.statics.STATUSES = ALERT_STATUS;
SocialAlertSchema.statics.ALERT_TYPES = ALERT_TYPES;

module.exports = mongoose.model("SocialAlert", SocialAlertSchema);
module.exports.SEVERITIES = SEVERITIES;
module.exports.ALERT_STATUS = ALERT_STATUS;
module.exports.ALERT_TYPES = ALERT_TYPES;
