const mongoose = require("mongoose");

const ACTIVITY_TYPES = [
  "Meeting",
  "Conference",
  "Training",
  "Holiday",
  "Event",
  "Other",
];

const AttendeeSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeIdSnapshot: { type: String, trim: true, default: "" },
    fullNameSnapshot: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ACTIVITY_TYPES, default: "Meeting" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    attendees: { type: [AttendeeSchema], default: [] },
    attachedFile: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile", default: null },
      originalName: { type: String, trim: true, default: "" },
      url: { type: String, trim: true, default: "" },
      mimeType: { type: String, trim: true, default: "" },
      size: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ActivitySchema.statics.ACTIVITY_TYPES = ACTIVITY_TYPES;

module.exports = mongoose.model("Activity", ActivitySchema);
