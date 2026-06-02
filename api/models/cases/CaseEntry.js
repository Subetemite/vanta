const mongoose = require("mongoose");

const CASE_CATEGORIES = [
  "focus-operations",
  "crime-clusters",
  "nalecc-scoc",
  "inter-agency",
  "accomplishment-reports",
  "socta-handbook",
];

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const CaseEntrySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: CASE_CATEGORIES,
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      trim: true,
      default: "open",
    },
    priority: {
      type: String,
      trim: true,
      default: "normal",
    },
    leadAgency: {
      type: String,
      trim: true,
      default: "",
    },
    coordinatingAgencies: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    occurredAt: {
      type: Date,
      default: null,
    },
    reportedAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

CaseEntrySchema.statics.CATEGORIES = CASE_CATEGORIES;

module.exports = mongoose.model("CaseEntry", CaseEntrySchema);
module.exports.CASE_CATEGORIES = CASE_CATEGORIES;
