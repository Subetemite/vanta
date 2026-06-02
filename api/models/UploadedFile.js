const mongoose = require("mongoose");

const UploadedFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    extension: {
      type: String,
      default: "",
      trim: true,
    },
    relativePath: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      default: "",
    },
    extractionStatus: {
      type: String,
      enum: ["not_applicable", "pending", "completed", "failed"],
      default: "not_applicable",
    },
    extractedAt: {
      type: Date,
      default: null,
    },
    extractionError: {
      type: String,
      default: "",
      trim: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaseFolder",
      default: null,
      index: true,
    },
    caseCategory: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    uploadedBy: {
      id: {
        type: String,
        default: "",
      },
      username: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

UploadedFileSchema.index(
  {
    originalName: "text",
    extractedText: "text",
  },
  {
    weights: {
      originalName: 8,
      extractedText: 2,
    },
    name: "uploaded_file_text_search",
  }
);

module.exports = mongoose.model("UploadedFile", UploadedFileSchema);
