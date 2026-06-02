const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema({
  personalInformation: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    alias: {
      type: String,
      trim: true,
      default: "",
    },
    sex: {
      type: String,
      trim: true,
      default: "",
    },
    civilStatus: {
      type: String,
      trim: true,
      default: "",
    },
    birthDate: {
      type: String,
      trim: true,
      default: "",
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    nationality: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  operationDetails: {
    operationName: {
      type: String,
      trim: true,
      default: "",
    },
    operationAddress: {
      type: String,
      trim: true,
      default: "",
    },
    operationDate: {
      type: String,
      trim: true,
      default: "",
    },
    disposition: {
      type: String,
      trim: true,
      default: "",
    },
    visaStatus: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    actions: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
  },
  biometrics: {
    heightCm: {
      type: Number,
      default: null,
    },
    weightKg: {
      type: Number,
      default: null,
    },
    bloodType: {
      type: String,
      trim: true,
      default: "",
    },
    eyeColor: {
      type: String,
      trim: true,
      default: "",
    },
    hairColor: {
      type: String,
      trim: true,
      default: "",
    },
    complexion: {
      type: String,
      trim: true,
      default: "",
    },
    distinguishingMarks: {
      type: String,
      trim: true,
      default: "",
    },
    fingerprintCode: {
      type: String,
      trim: true,
      default: "",
    },
  },
  profilePhoto: {
    fileName: {
      type: String,
      trim: true,
      default: "",
    },
    mimeType: {
      type: String,
      trim: true,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    dataUrl: {
      type: String,
      default: "",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Record", RecordSchema);
