const mongoose = require("mongoose");

const POST_TYPES = ["text", "image", "video", "link", "story", "live", "comment", "share"];
const SENTIMENTS = ["positive", "neutral", "negative", "hostile", "unknown"];

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const SocialPostSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount", default: null, index: true },
    accountHandle: { type: String, trim: true, default: "" },
    platform: { type: String, trim: true, default: "", index: true },
    postUrl: { type: String, trim: true, default: "" },
    postType: { type: String, enum: POST_TYPES, default: "text" },
    content: { type: String, trim: true, default: "" },
    extractedText: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "" },
    sentiment: { type: String, enum: SENTIMENTS, default: "unknown", index: true },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    capturedAt: { type: Date, default: Date.now },
    postedAt: { type: Date, default: null },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "SocialCampaign", default: null },
    attachments: { type: [AttachmentSchema], default: [] },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SocialPostSchema.statics.POST_TYPES = POST_TYPES;
SocialPostSchema.statics.SENTIMENTS = SENTIMENTS;

module.exports = mongoose.model("SocialPost", SocialPostSchema);
module.exports.POST_TYPES = POST_TYPES;
module.exports.SENTIMENTS = SENTIMENTS;
