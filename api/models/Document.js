const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  title: String,

  description: String,

  referenceNumber: String,

  originatingDepartment: String,

  status: {
    type: String,
    default: "Pending",
  },

  currentDepartment: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
