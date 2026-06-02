const mongoose = require("mongoose");

const DEPLOYMENT_STATUS = ["scheduled", "deployed", "returned", "extracted", "cancelled"];

const DeploymentSchema = new mongoose.Schema(
  {
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
    missionCodeName: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    personnel: {
      name: { type: String, trim: true, required: true },
      rank: { type: String, trim: true, default: "" },
      unit: { type: String, trim: true, default: "" },
      contact: { type: String, trim: true, default: "" },
    },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    vehiclePlate: { type: String, trim: true, default: "" },
    deploymentLocation: { type: String, trim: true, default: "" },
    deployedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    status: { type: String, enum: DEPLOYMENT_STATUS, default: "scheduled", index: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

DeploymentSchema.statics.STATUSES = DEPLOYMENT_STATUS;

module.exports = mongoose.model("Deployment", DeploymentSchema);
module.exports.DEPLOYMENT_STATUS = DEPLOYMENT_STATUS;
