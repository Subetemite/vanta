const mongoose = require("mongoose");

const CATEGORIES = ["incoming", "outgoing"];

const ACTION_OPTIONS = [
  "01 – Approval",
  "02 – Signature",
  "03 – Appropriate Action",
  "04 – Comment/Recommendation",
  "05 – For Study",
  "06 – Reply Direct to Writer",
  "07 – Retype/Redraft",
  "08 – Attn to HWI",
  "09 – Pls see me",
  "10 – Calendar/Remind me",
  "11 – Dispatch",
  "12 – Dissemination",
  "13 – Notation/Information",
  "14 – File",
];

const RoutingLineSchema = new mongoose.Schema(
  {
    from: { type: String, trim: true, default: "" },
    fromEmployeeId: { type: String, trim: true, default: "" },
    to: { type: String, trim: true, default: "" },
    toEmployeeId: { type: String, trim: true, default: "" },
    actionRequested: {
      type: [String],
      enum: ACTION_OPTIONS,
      default: [],
    },
    date: { type: Date, default: null },
    senderName: { type: String, trim: true, default: "" },
    additionalRemarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const RoutingCommentSchema = new mongoose.Schema(
  {
    author: { type: String, trim: true, default: "" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    text: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoutingRecordSchema = new mongoose.Schema(
  {
    controlNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "incoming",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    encoder: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      code: { type: String, trim: true, default: "" },
      username: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
    },
    lines: {
      type: [RoutingLineSchema],
      validate: [
        (value) => Array.isArray(value) && value.length >= 1 && value.length <= 5,
        "A record must have between 1 and 5 routing lines.",
      ],
    },
    comments: {
      type: [RoutingCommentSchema],
      default: [],
    },
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

RoutingRecordSchema.statics.ACTION_OPTIONS = ACTION_OPTIONS;
RoutingRecordSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("RoutingRecord", RoutingRecordSchema);
