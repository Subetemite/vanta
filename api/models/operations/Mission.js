const mongoose = require("mongoose");

const MISSION_STATUS = ["planned", "active", "paused", "completed", "cancelled"];
const MISSION_TYPES = [
  "surveillance",
  "raid",
  "checkpoint",
  "rescue",
  "investigation",
  "escort",
  "patrol",
  "joint-operation",
  "intelligence",
  "other",
];
const PRIORITIES = ["low", "normal", "high", "critical"];

const MissionSchema = new mongoose.Schema(
  {
    codeName: { type: String, required: true, trim: true, index: true },
    missionId: { type: String, trim: true, unique: true, sparse: true, index: true },
    type: { type: String, enum: MISSION_TYPES, default: "investigation", index: true },
    objective: { type: String, trim: true, default: "" },
    status: { type: String, enum: MISSION_STATUS, default: "planned", index: true },
    priority: { type: String, enum: PRIORITIES, default: "normal" },
    leadAgency: { type: String, trim: true, default: "" },
    coordinatingAgencies: { type: [String], default: [] },
    commander: { type: String, trim: true, default: "" },
    teamLeader: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    cityDistrict: { type: String, trim: true, default: "" },
    plannedStart: { type: Date, default: null },
    plannedEnd: { type: Date, default: null },
    actualStart: { type: Date, default: null },
    actualEnd: { type: Date, default: null },
    description: { type: String, trim: true, default: "" },
    classification: {
      type: String,
      enum: ["unclassified", "restricted", "confidential", "secret", "top-secret"],
      default: "unclassified",
    },
    tags: { type: [String], default: [] },
    relatedCaseEntries: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

MissionSchema.statics.STATUSES = MISSION_STATUS;
MissionSchema.statics.TYPES = MISSION_TYPES;
MissionSchema.statics.PRIORITIES = PRIORITIES;

module.exports = mongoose.model("Mission", MissionSchema);
module.exports.MISSION_STATUS = MISSION_STATUS;
module.exports.MISSION_TYPES = MISSION_TYPES;
module.exports.PRIORITIES = PRIORITIES;
