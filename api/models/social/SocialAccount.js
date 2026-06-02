const mongoose = require("mongoose");

const PLATFORMS = ["facebook", "twitter", "x", "instagram", "tiktok", "youtube", "telegram", "viber", "messenger", "whatsapp", "reddit", "discord", "other"];
const ACCOUNT_TYPES = ["target", "asset", "agency", "informant", "civilian", "official"];
const ACCOUNT_STATUS = ["monitoring", "watch-list", "archived", "cleared"];

const SocialAccountSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, trim: true, index: true },
    displayName: { type: String, trim: true, default: "" },
    platform: { type: String, enum: PLATFORMS, required: true, index: true },
    profileUrl: { type: String, trim: true, default: "" },
    accountType: { type: String, enum: ACCOUNT_TYPES, default: "target", index: true },
    status: { type: String, enum: ACCOUNT_STATUS, default: "monitoring", index: true },
    suspectedRealName: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    followers: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "moderate",
    },
    tags: { type: [String], default: [] },
    relatedCampaigns: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    notes: { type: String, trim: true, default: "" },
    lastActivityAt: { type: Date, default: null },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SocialAccountSchema.statics.PLATFORMS = PLATFORMS;
SocialAccountSchema.statics.ACCOUNT_TYPES = ACCOUNT_TYPES;
SocialAccountSchema.statics.STATUSES = ACCOUNT_STATUS;

module.exports = mongoose.model("SocialAccount", SocialAccountSchema);
module.exports.PLATFORMS = PLATFORMS;
module.exports.ACCOUNT_TYPES = ACCOUNT_TYPES;
module.exports.ACCOUNT_STATUS = ACCOUNT_STATUS;
