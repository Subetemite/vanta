const mongoose = require("mongoose");

const TrackingSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },

  fromDepartment: String,

  toDepartment: String,

  action: String,

  remarks: String,

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Tracking", TrackingSchema);
