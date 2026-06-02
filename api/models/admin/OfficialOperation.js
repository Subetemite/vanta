const mongoose = require("mongoose");

const AssigneeSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeIdSnapshot: { type: String, trim: true, default: "" },
    fullNameSnapshot: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const OfficialOperationSchema = new mongoose.Schema(
  {
    operationName: { type: String, required: true, trim: true },
    referenceOrder: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, trim: true, default: "" },
    assignees: { type: [AssigneeSchema], default: [] },
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

module.exports = mongoose.model("OfficialOperation", OfficialOperationSchema);
