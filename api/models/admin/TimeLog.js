const mongoose = require("mongoose");

const TimeLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeIdSnapshot: { type: String, trim: true, default: "" },
    employeeNameSnapshot: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    amIn: { type: Date, default: null },
    amOut: { type: Date, default: null },
    pmIn: { type: Date, default: null },
    pmOut: { type: Date, default: null },
    totalHours: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

TimeLogSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TimeLog", TimeLogSchema);
