const mongoose = require("mongoose");

const STATUS_OPTIONS = [
  "Active",
  "On Leave",
  "Resigned",
  "Retired",
  "Terminated",
];

const FileRefSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    originalName: { type: String, default: "" },
    url: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const RelativeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    suffix: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    dateHired: { type: Date, default: null },
    status: { type: String, enum: STATUS_OPTIONS, default: "Active" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    birthDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
    profilePicture: { type: FileRefSchema, default: null },
    relatives: { type: [RelativeSchema], default: [] },
  },
  { timestamps: true }
);

EmployeeSchema.statics.STATUS_OPTIONS = STATUS_OPTIONS;

module.exports = mongoose.model("Employee", EmployeeSchema);
