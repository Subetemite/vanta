const mongoose = require("mongoose");

const CAMPAIGN_STATUS = ["planned", "active", "paused", "completed", "archived"];

const SocialCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    objective: { type: String, trim: true, default: "" },
    status: { type: String, enum: CAMPAIGN_STATUS, default: "planned", index: true },
    keywords: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    platforms: { type: [String], default: [] },
    leadAnalyst: { type: String, trim: true, default: "" },
    team: { type: [String], default: [] },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    targetAccounts: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SocialCampaignSchema.statics.STATUSES = CAMPAIGN_STATUS;

module.exports = mongoose.model("SocialCampaign", SocialCampaignSchema);
module.exports.CAMPAIGN_STATUS = CAMPAIGN_STATUS;
