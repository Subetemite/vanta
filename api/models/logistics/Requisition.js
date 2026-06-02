const mongoose = require("mongoose");

const REQUISITION_STATUS = [
  "draft",
  "pending",
  "approved",
  "denied",
  "issued",
  "returned",
  "completed",
  "cancelled",
];

const REQUISITION_PRIORITY = ["low", "normal", "high", "urgent"];

const LineItemSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", default: null },
    name: { type: String, trim: true, required: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, trim: true, default: "pcs" },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const RequisitionSchema = new mongoose.Schema(
  {
    refNo: { type: String, trim: true, unique: true, index: true },
    requestor: {
      name: { type: String, trim: true, default: "" },
      unit: { type: String, trim: true, default: "" },
      contact: { type: String, trim: true, default: "" },
    },
    purpose: { type: String, trim: true, default: "" },
    items: { type: [LineItemSchema], default: [] },
    status: {
      type: String,
      enum: REQUISITION_STATUS,
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: REQUISITION_PRIORITY,
      default: "normal",
    },
    requestedAt: { type: Date, default: Date.now },
    neededBy: { type: Date, default: null },
    approvedBy: { type: String, trim: true, default: "" },
    approvedAt: { type: Date, default: null },
    denialReason: { type: String, trim: true, default: "" },
    issuedBy: { type: String, trim: true, default: "" },
    issuedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

RequisitionSchema.statics.STATUSES = REQUISITION_STATUS;
RequisitionSchema.statics.PRIORITIES = REQUISITION_PRIORITY;

module.exports = mongoose.model("Requisition", RequisitionSchema);
module.exports.REQUISITION_STATUS = REQUISITION_STATUS;
module.exports.REQUISITION_PRIORITY = REQUISITION_PRIORITY;
