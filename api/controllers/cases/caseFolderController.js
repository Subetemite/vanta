const fs = require("fs/promises");
const path = require("path");
const CaseFolder = require("../../models/cases/CaseFolder");
const UploadedFile = require("../../models/UploadedFile");
const { extractTextFromBuffer } = require("../../utils/extractText");

const FILES_DIRECTORY = path.join(__dirname, "..", "..", "uploads", "files");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DATA_URL_PREFIX_PATTERN = /^data:[^;]+;base64,/i;
const VALID_CATEGORIES = CaseFolder.CASE_CATEGORIES;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeBaseName(fileName = "") {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildFileUrl(req, storedName) {
  return `${req.protocol}://${req.get("host")}/uploads/files/${storedName}`;
}

function fileResponse(req, file) {
  return {
    id: file._id,
    folderId: file.folderId,
    originalName: file.originalName,
    storedName: file.storedName,
    mimeType: file.mimeType,
    size: file.size,
    extension: file.extension,
    extractionStatus: file.extractionStatus,
    extractedAt: file.extractedAt,
    extractionError: file.extractionError,
    extractedTextPreview: file.extractedText ? file.extractedText.slice(0, 320) : "",
    extractedTextLength: file.extractedText ? file.extractedText.length : 0,
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    url: buildFileUrl(req, file.storedName),
  };
}

function folderResponse(folder) {
  return {
    id: folder._id,
    _id: folder._id,
    name: folder.name,
    category: folder.category,
    referenceNo: folder.referenceNo,
    description: folder.description,
    leadAgency: folder.leadAgency,
    coordinatingAgencies: folder.coordinatingAgencies,
    status: folder.status,
    color: folder.color,
    tags: folder.tags,
    fileCount: folder.fileCount,
    createdBy: folder.createdBy,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

function ensureValidCategory(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    const err = new Error(`Unknown case category "${category}".`);
    err.status = 400;
    throw err;
  }
}

exports.list = async (req, res) => {
  try {
    const { category } = req.params;
    ensureValidCategory(category);
    const filter = { category };
    if (req.query.status) filter.status = req.query.status;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { name: rx },
        { referenceNo: rx },
        { description: rx },
        { leadAgency: rx },
      ];
    }
    const folders = await CaseFolder.find(filter).sort({ updatedAt: -1 });
    res.json(folders.map(folderResponse));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to load case folders." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const folder = await CaseFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const fileQuery = String(req.query.q || "").trim();
    const fileFilter = { folderId: folder._id };
    let files;
    if (fileQuery) {
      const rx = new RegExp(escapeRegex(fileQuery), "i");
      fileFilter.$or = [{ originalName: rx }, { extractedText: rx }];
      files = await UploadedFile.find(fileFilter).sort({ createdAt: -1 });
    } else {
      files = await UploadedFile.find(fileFilter).sort({ createdAt: -1 });
    }

    res.json({
      folder: folderResponse(folder),
      files: files.map((f) => fileResponse(req, f)),
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load folder." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Folder name is required." });
    }
    ensureValidCategory(category);

    const folder = await CaseFolder.create({
      name: String(name).trim(),
      category,
      referenceNo: req.body.referenceNo || "",
      description: req.body.description || "",
      leadAgency: req.body.leadAgency || "",
      coordinatingAgencies: Array.isArray(req.body.coordinatingAgencies)
        ? req.body.coordinatingAgencies.filter(Boolean).map((s) => String(s).trim())
        : [],
      status: req.body.status || "open",
      color: req.body.color || "",
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      createdBy: {
        id: req.user?.sub || "",
        username: req.user?.username || "",
        email: req.user?.email || "",
      },
    });

    res.status(201).json({ message: "Folder created.", folder: folderResponse(folder) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to create folder." });
  }
};

exports.update = async (req, res) => {
  try {
    const folder = await CaseFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const updatable = ["name", "referenceNo", "description", "leadAgency", "status", "color"];
    for (const key of updatable) {
      if (req.body[key] !== undefined) folder[key] = req.body[key];
    }
    if (Array.isArray(req.body.coordinatingAgencies)) {
      folder.coordinatingAgencies = req.body.coordinatingAgencies
        .filter(Boolean)
        .map((s) => String(s).trim());
    }
    if (Array.isArray(req.body.tags)) folder.tags = req.body.tags;
    await folder.save();

    res.json({ message: "Folder updated.", folder: folderResponse(folder) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update folder." });
  }
};

async function deleteFileRecord(file) {
  if (!file) return;
  try {
    if (file.relativePath) {
      await fs.unlink(path.join(FILES_DIRECTORY, "..", file.relativePath));
    }
  } catch {
    /* ignore missing file on disk */
  }
  await UploadedFile.deleteOne({ _id: file._id });
}

exports.remove = async (req, res) => {
  try {
    const folder = await CaseFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const files = await UploadedFile.find({ folderId: folder._id });
    for (const file of files) {
      await deleteFileRecord(file);
    }
    await CaseFolder.deleteOne({ _id: folder._id });
    res.json({ message: "Folder and contents deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete folder." });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const folder = await CaseFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const { fileName, mimeType, contentBase64 } = req.body;
    if (!fileName || !contentBase64) {
      return res.status(400).json({ message: "File name and file content are required." });
    }

    const normalized = String(contentBase64).replace(DATA_URL_PREFIX_PATTERN, "").replace(/\s/g, "");
    const buffer = Buffer.from(normalized, "base64");
    if (!buffer.length) return res.status(400).json({ message: "The uploaded file is empty or invalid." });
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ message: "Please upload a file 10 MB or smaller." });
    }

    const extension = path.extname(fileName).toLowerCase();
    const safeBase = sanitizeBaseName(fileName) || "file";
    const storedName = `${Date.now()}-${safeBase}${extension}`;
    const relativePath = path.posix.join("files", storedName);
    const fullPath = path.join(FILES_DIRECTORY, storedName);

    const { extractedText, extractionStatus, extractionError } = await extractTextFromBuffer({
      fileName,
      mimeType,
      buffer,
    });

    await fs.mkdir(FILES_DIRECTORY, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    const saved = await UploadedFile.create({
      originalName: path.basename(fileName),
      storedName,
      mimeType: mimeType || "application/octet-stream",
      size: buffer.length,
      extension,
      relativePath,
      extractedText,
      extractionStatus,
      extractedAt: extractionStatus === "completed" ? new Date() : null,
      extractionError,
      folderId: folder._id,
      caseCategory: folder.category,
      uploadedBy: {
        id: req.user?.sub || "",
        username: req.user?.username || "",
        email: req.user?.email || "",
      },
    });

    folder.fileCount = await UploadedFile.countDocuments({ folderId: folder._id });
    await folder.save();

    res.status(201).json({
      message: "File uploaded.",
      file: fileResponse(req, saved),
      folder: folderResponse(folder),
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to upload file.", error: error.message });
  }
};

exports.removeFile = async (req, res) => {
  try {
    const folder = await CaseFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const file = await UploadedFile.findOne({ _id: req.params.fileId, folderId: folder._id });
    if (!file) return res.status(404).json({ message: "File not found in this folder." });

    await deleteFileRecord(file);
    folder.fileCount = await UploadedFile.countDocuments({ folderId: folder._id });
    await folder.save();

    res.json({ message: "File deleted.", folder: folderResponse(folder) });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete file." });
  }
};

exports.getFileText = async (req, res) => {
  try {
    const file = await UploadedFile.findOne({
      _id: req.params.fileId,
      folderId: req.params.id,
    });
    if (!file) return res.status(404).json({ message: "File not found." });
    res.json({
      id: file._id,
      originalName: file.originalName,
      extractionStatus: file.extractionStatus,
      extractionError: file.extractionError,
      extractedAt: file.extractedAt,
      extractedText: file.extractedText || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load extracted text." });
  }
};
