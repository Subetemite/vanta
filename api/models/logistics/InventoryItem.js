const mongoose = require("mongoose");

const INVENTORY_CATEGORIES = [
  "equipment",
  "supplies",
  "communications",
  "ammunition",
  "ppe",
  "tools",
  "uniform",
  "other",
];

const INVENTORY_STATUS = [
  "in-stock",
  "low-stock",
  "out-of-stock",
  "retired",
];

const INVENTORY_SCOPES = ["office", "case"];

const InventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: INVENTORY_SCOPES,
      default: "office",
      index: true,
    },
    category: {
      type: String,
      enum: INVENTORY_CATEGORIES,
      default: "other",
      index: true,
    },
    description: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "pcs" },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    location: { type: String, trim: true, default: "" },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    supplierName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: INVENTORY_STATUS,
      default: "in-stock",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

InventoryItemSchema.pre("save", function (next) {
  if (this.quantity <= 0) this.status = "out-of-stock";
  else if (this.quantity <= this.minStock) this.status = "low-stock";
  else if (this.status !== "retired") this.status = "in-stock";
  next();
});

InventoryItemSchema.statics.CATEGORIES = INVENTORY_CATEGORIES;
InventoryItemSchema.statics.STATUSES = INVENTORY_STATUS;
InventoryItemSchema.statics.SCOPES = INVENTORY_SCOPES;

module.exports = mongoose.model("InventoryItem", InventoryItemSchema);
module.exports.INVENTORY_CATEGORIES = INVENTORY_CATEGORIES;
module.exports.INVENTORY_STATUS = INVENTORY_STATUS;
module.exports.INVENTORY_SCOPES = INVENTORY_SCOPES;
