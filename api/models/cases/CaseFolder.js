const mongoose = require("mongoose");

const CASE_CATEGORIES = [
  "focus-operations",
  "crime-clusters",
  "nalecc-scoc",
  "inter-agency",
  "accomplishment-reports",
  "socta-handbook",
];

const FOLDER_STATUS = ["open", "active", "archived", "closed"];

const CaseFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: CASE_CATEGORIES,
      index: true,
    },
    referenceNo: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    leadAgency: { type: String, trim: true, default: "" },
    coordinatingAgencies: { type: [String], default: [] },
    status: {
      type: String,
      enum: FOLDER_STATUS,
      default: "open",
      index: true,
    },
    color: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    fileCount: { type: Number, default: 0, min: 0 },
    createdBy: {
      id: { type: String, default: "" },
      username: { type: String, default: "" },
      email: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

CaseFolderSchema.index({ category: 1, name: 1 });
CaseFolderSchema.statics.CATEGORIES = CASE_CATEGORIES;
CaseFolderSchema.statics.STATUSES = FOLDER_STATUS;

module.exports = mongoose.model("CaseFolder", CaseFolderSchema);
module.exports.CASE_CATEGORIES = CASE_CATEGORIES;
module.exports.FOLDER_STATUS = FOLDER_STATUS;
