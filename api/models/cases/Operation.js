const mongoose = require("mongoose");

const OperationSchema = new mongoose.Schema({
  operationId: {
    type: String,
    required: true,
    trim: true,
  },
  operationCodeName: {
    type: String,
    required: true,
    trim: true,
  },
  operationType: {
    type: String,
    required: true,
    trim: true,
  },
  objective: {
    type: String,
    trim: true,
    default: "",
  },
  plannedDateTime: {
    type: String,
    trim: true,
    default: "",
  },
  actualDateTime: {
    type: String,
    trim: true,
    default: "",
  },
  fullAddress: {
    type: String,
    trim: true,
    default: "",
  },
  cityDistrict: {
    type: String,
    trim: true,
    default: "",
  },
  operationCommander: {
    type: String,
    trim: true,
    default: "",
  },
  teamLeader: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Operation", OperationSchema);
