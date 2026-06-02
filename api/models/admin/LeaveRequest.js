const mongoose = require("mongoose");

const LEAVE_TYPES = [
  "Vacation Leave",
  "Sick Leave",
  "Mandatory/Forced Leave",
  "Special Privilege Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Solo Parent Leave",
  "Study Leave",
  "10-Day VAWC Leave",
  "Rehabilitation Leave",
  "Special Leave Benefit for Women",
  "Adoption Leave",
  "Special Emergency Leave",
  "Other",
];

const LEAVE_STATUS = ["Pending", "Approved", "Rejected", "Cancelled"];

const LeaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeIdSnapshot: { type: String, trim: true, default: "" },
    employeeNameSnapshot: { type: String, trim: true, default: "" },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, default: 0 },
    reason: { type: String, trim: true, default: "" },
    status: { type: String, enum: LEAVE_STATUS, default: "Pending" },
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

LeaveRequestSchema.statics.LEAVE_TYPES = LEAVE_TYPES;
LeaveRequestSchema.statics.LEAVE_STATUS = LEAVE_STATUS;

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
