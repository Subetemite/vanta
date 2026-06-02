const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "officer", "viewer"],
      default: "viewer",
    },

    active: {
      type: Boolean,
      default: true,
    },

    avatarStoredName: {
      type: String,
      default: "",
    },

    permissions: {
      createReports: { type: Boolean, default: false },
      editIncidents: { type: Boolean, default: false },
      deleteRecords: { type: Boolean, default: false },
      viewConfidentialData: { type: Boolean, default: false },
    },

    modulePermissions: {
      admin: { type: Boolean, default: true },
      cases: { type: Boolean, default: false },
      logistics: { type: Boolean, default: false },
      operations: { type: Boolean, default: false },
      social: { type: Boolean, default: false },
    },

    moduleRoles: {
      admin: { type: String, enum: ["admin", "viewer"], default: "viewer" },
      cases: { type: String, enum: ["admin", "viewer"], default: "viewer" },
      logistics: { type: String, enum: ["admin", "viewer"], default: "viewer" },
      operations: { type: String, enum: ["admin", "viewer"], default: "viewer" },
      social: { type: String, enum: ["admin", "viewer"], default: "viewer" },
    },

    employee: {
      employeeId: { type: String, trim: true, default: "" },
      firstName: { type: String, trim: true, default: "" },
      middleName: { type: String, trim: true, default: "" },
      lastName: { type: String, trim: true, default: "" },
      department: { type: String, trim: true, default: "" },
      position: { type: String, trim: true, default: "" },
      dateHired: { type: Date, default: null },
      defaultShiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
