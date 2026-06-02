const mongoose = require("mongoose");

const STATUS_OPTIONS = ["Draft", "Submitted", "Approved"];

const TargetSchema = new mongoose.Schema(
  {
    mfoProgram: { type: String, trim: true, default: "" },
    successIndicator: { type: String, trim: true, default: "" },
    target: { type: String, trim: true, default: "" },
    accomplishment: { type: String, trim: true, default: "" },
    quality: { type: Number, min: 0, max: 5, default: 0 },
    efficiency: { type: Number, min: 0, max: 5, default: 0 },
    timeliness: { type: Number, min: 0, max: 5, default: 0 },
    averageRating: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const OpcrSchema = new mongoose.Schema(
  {
    office: { type: String, required: true, trim: true },
    ratingPeriod: { type: String, required: true, trim: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    status: { type: String, enum: STATUS_OPTIONS, default: "Draft" },
    preparedBy: { type: String, trim: true, default: "" },
    reviewedBy: { type: String, trim: true, default: "" },
    approvedBy: { type: String, trim: true, default: "" },
    approvedAt: { type: Date, default: null },
    targets: { type: [TargetSchema], default: [] },
    overallRating: { type: Number, default: 0 },
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

OpcrSchema.statics.STATUS_OPTIONS = STATUS_OPTIONS;

module.exports = mongoose.model("Opcr", OpcrSchema);
