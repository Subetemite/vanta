const mongoose = require("mongoose");

const ASSET_TYPES = ["vehicle", "equipment", "other"];
const MAINTENANCE_TYPES = ["preventive", "corrective", "inspection", "repair", "calibration"];

const MaintenanceLogSchema = new mongoose.Schema(
  {
    assetType: { type: String, enum: ASSET_TYPES, default: "vehicle", index: true },
    assetRef: { type: mongoose.Schema.Types.ObjectId, refPath: "assetRefModel", default: null },
    assetRefModel: { type: String, enum: ["Vehicle", "InventoryItem"], default: "Vehicle" },
    assetName: { type: String, trim: true, default: "" },
    type: { type: String, enum: MAINTENANCE_TYPES, default: "preventive" },
    description: { type: String, trim: true, default: "" },
    performedAt: { type: Date, default: Date.now },
    performedBy: { type: String, trim: true, default: "" },
    vendor: { type: String, trim: true, default: "" },
    cost: { type: Number, default: 0, min: 0 },
    nextDueAt: { type: Date, default: null },
    odometer: { type: Number, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

MaintenanceLogSchema.statics.ASSET_TYPES = ASSET_TYPES;
MaintenanceLogSchema.statics.MAINTENANCE_TYPES = MAINTENANCE_TYPES;

module.exports = mongoose.model("MaintenanceLog", MaintenanceLogSchema);
module.exports.ASSET_TYPES = ASSET_TYPES;
module.exports.MAINTENANCE_TYPES = MAINTENANCE_TYPES;
