const mongoose = require("mongoose");

const CATEGORY_OPTIONS = [
  "201_FILE",
  "SALN",
  "BIR_2316",
  "PDS",
  "IPCR",
  "OTHER_PERSONAL",
  "TRAINING_CERT",
  "COMMENDATION",
];

const CATEGORY_LABELS = {
  "201_FILE": "201 File",
  SALN: "SALN",
  BIR_2316: "BIR 2316",
  PDS: "Personal Data Sheet (PDS)",
  IPCR: "IPCR",
  OTHER_PERSONAL: "Other Personal Documents",
  TRAINING_CERT: "Training Certificate",
  COMMENDATION: "Commendation",
};

const HrisDocumentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: CATEGORY_OPTIONS,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    documentDate: { type: Date, default: null },
    description: { type: String, trim: true, default: "" },
    attachedFile: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile", default: null },
      originalName: { type: String, trim: true, default: "" },
      url: { type: String, trim: true, default: "" },
      mimeType: { type: String, trim: true, default: "" },
      size: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

HrisDocumentSchema.statics.CATEGORY_OPTIONS = CATEGORY_OPTIONS;
HrisDocumentSchema.statics.CATEGORY_LABELS = CATEGORY_LABELS;

module.exports = mongoose.model("HrisDocument", HrisDocumentSchema);
