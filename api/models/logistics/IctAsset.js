const mongoose = require("mongoose");

const ICT_CATEGORIES = [
  "desktop",
  "laptop",
  "server",
  "monitor",
  "printer",
  "scanner",
  "network",
  "storage",
  "mobile",
  "tablet",
  "peripheral",
  "software",
  "communication",
  "other",
];

const ICT_STATUS = [
  "in-use",
  "in-storage",
  "deployed",
  "for-repair",
  "for-disposal",
  "retired",
  "lost",
];

const ICT_CONDITION = ["new", "good", "fair", "poor", "damaged"];

const ICT_SCOPES = ["office", "case"];

const IctAssetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, trim: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: ICT_SCOPES,
      default: "office",
      index: true,
    },
    category: {
      type: String,
      enum: ICT_CATEGORIES,
      default: "other",
      index: true,
    },
    brand: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    serialNo: { type: String, trim: true, default: "", index: true },

    // Network / identifiers
    macAddress: { type: String, trim: true, default: "" },
    ipAddress: { type: String, trim: true, default: "" },
    hostname: { type: String, trim: true, default: "" },

    // Specs (free-form for flexibility across categories)
    operatingSystem: { type: String, trim: true, default: "" },
    cpu: { type: String, trim: true, default: "" },
    ramGb: { type: Number, default: 0, min: 0 },
    storage: { type: String, trim: true, default: "" },

    // Software-specific
    licenseKey: { type: String, trim: true, default: "" },
    licenseSeats: { type: Number, default: 0, min: 0 },
    licenseExpiry: { type: Date, default: null },

    // Lifecycle
    status: {
      type: String,
      enum: ICT_STATUS,
      default: "in-storage",
      index: true,
    },
    condition: {
      type: String,
      enum: ICT_CONDITION,
      default: "good",
    },

    // Assignment
    assignedTo: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    deployedAt: { type: Date, default: null },

    // Acquisition
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    supplierName: { type: String, trim: true, default: "" },
    purchaseDate: { type: Date, default: null },
    purchaseCost: { type: Number, default: 0, min: 0 },
    warrantyExpiry: { type: Date, default: null },
    poNumber: { type: String, trim: true, default: "" },

    photoStoredName: { type: String, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

IctAssetSchema.statics.CATEGORIES = ICT_CATEGORIES;
IctAssetSchema.statics.STATUSES = ICT_STATUS;
IctAssetSchema.statics.CONDITIONS = ICT_CONDITION;
IctAssetSchema.statics.SCOPES = ICT_SCOPES;

module.exports = mongoose.model("IctAsset", IctAssetSchema);
module.exports.ICT_CATEGORIES = ICT_CATEGORIES;
module.exports.ICT_STATUS = ICT_STATUS;
module.exports.ICT_CONDITION = ICT_CONDITION;
module.exports.ICT_SCOPES = ICT_SCOPES;
