const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "routing.assigned",
  "routing.commented",
  "general",
];

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "general" },
    title: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.statics.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model("Notification", NotificationSchema);
