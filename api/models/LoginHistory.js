const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    role: {
      type: String,
      trim: true,
      default: "viewer",
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["success"],
      default: "success",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
