const mongoose = require("mongoose");

const VEHICLE_TYPES = [
  "patrol",
  "transport",
  "motorcycle",
  "utility",
  "armored",
  "other",
];

const VEHICLE_STATUS = [
  "available",
  "dispatched",
  "maintenance",
  "retired",
];

const VEHICLE_SCOPES = ["office", "case"];

const VehicleSchema = new mongoose.Schema(
  {
    plateNo: { type: String, required: true, trim: true, unique: true, index: true },
    scope: {
      type: String,
      enum: VEHICLE_SCOPES,
      default: "office",
      index: true,
    },
    engineNo: { type: String, trim: true, default: "" },
    chassisNo: { type: String, trim: true, default: "" },
    type: { type: String, enum: VEHICLE_TYPES, default: "patrol", index: true },
    make: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    year: { type: Number, default: null },
    color: { type: String, trim: true, default: "" },
    registeredOwner: { type: String, trim: true, default: "" },
    ownerAddress: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: VEHICLE_STATUS,
      default: "available",
      index: true,
    },
    assignedUnit: { type: String, trim: true, default: "" },
    currentDriver: { type: String, trim: true, default: "" },
    mileage: { type: Number, default: 0, min: 0 },
    fuelType: { type: String, trim: true, default: "" },
    registrationExpiry: { type: Date, default: null },
    insuranceExpiry: { type: Date, default: null },
    lastServicedAt: { type: Date, default: null },
    nextServiceAt: { type: Date, default: null },
    photoStoredName: { type: String, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

VehicleSchema.statics.TYPES = VEHICLE_TYPES;
VehicleSchema.statics.STATUSES = VEHICLE_STATUS;
VehicleSchema.statics.SCOPES = VEHICLE_SCOPES;

module.exports = mongoose.model("Vehicle", VehicleSchema);
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
module.exports.VEHICLE_STATUS = VEHICLE_STATUS;
module.exports.VEHICLE_SCOPES = VEHICLE_SCOPES;
