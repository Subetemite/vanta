const fs = require("fs/promises");
const path = require("path");
const UploadedFile = require("../models/UploadedFile");
const { cleanText } = require("../utils/cases/textCleaner");
const { organizeFieldsAsync } = require("../utils/cases/fieldOrganizer");
const { extractTextFromBuffer } = require("../utils/extractText");

const FILES_DIRECTORY = path.join(__dirname, "..", "uploads", "files");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DATA_URL_PREFIX_PATTERN = /^data:[^;]+;base64,/i;

function buildFileUrl(req, storedName) {
  return `${req.protocol}://${req.get("host")}/uploads/files/${storedName}`;
}

function sanitizeBaseName(fileName = "") {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildSearchSnippet(text = "", query = "") {
  const normalizedText = normalizeExtractedText(text);
  const normalizedQuery = String(query).trim().toLowerCase();

  if (!normalizedText) {
    return "";
  }

  if (!normalizedQuery) {
    return normalizedText.slice(0, 240);
  }

  const searchTerms = normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  const textLower = normalizedText.toLowerCase();
  const firstMatchIndex = searchTerms.reduce((currentIndex, term) => {
    const nextIndex = textLower.indexOf(term);

    if (nextIndex === -1) {
      return currentIndex;
    }

    if (currentIndex === -1) {
      return nextIndex;
    }

    return Math.min(currentIndex, nextIndex);
  }, -1);

  if (firstMatchIndex === -1) {
    return normalizedText.slice(0, 240);
  }

  const snippetRadius = 120;
  const start = Math.max(firstMatchIndex - snippetRadius, 0);
  const end = Math.min(
    firstMatchIndex + snippetRadius + searchTerms[0].length,
    normalizedText.length
  );
  const prefix = start > 0 ? "... " : "";
  const suffix = end < normalizedText.length ? " ..." : "";

  return `${prefix}${normalizedText.slice(start, end)}${suffix}`;
}

function toFileResponse(req, file, query = "") {
  return {
    id: file._id,
    originalName: file.originalName,
    storedName: file.storedName,
    mimeType: file.mimeType,
    size: file.size,
    extension: file.extension,
    relativePath: file.relativePath,
    extractionStatus: file.extractionStatus,
    extractedAt: file.extractedAt,
    extractionError: file.extractionError,
    matchedContext: buildSearchSnippet(file.extractedText, query),
    extractedTextPreview: file.extractedText
      ? file.extractedText.slice(0, 240)
      : "",
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    url: buildFileUrl(req, file.storedName),
  };
}

async function buildAnalyzedFileResponse(req, file) {
  const response = toFileResponse(req, file, "");
  const cleaned = file.extractedText ? cleanText(file.extractedText) : "";
  const organized = cleaned ? await organizeFieldsAsync(cleaned) : null;
  response.cleanedText = cleaned;
  response.organized = organized;
  response.analyzedFields = organized?.suggestedFields || {};
  response.extractedText = file.extractedText || "";
  return response;
}

function normalizeExtractedText(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .trim();
}

exports.listFiles = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    let files;

    if (query) {
      files = await UploadedFile.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(100);
    } else {
      files = await UploadedFile.find().sort({ createdAt: -1 }).limit(100);
    }

    return res.status(200).json({
      query,
      files: files.map((file) => toFileResponse(req, file, query)),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load uploaded files.",
    });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { fileName, mimeType, contentBase64 } = req.body;

    if (!fileName || !contentBase64) {
      return res.status(400).json({
        message: "File name and file content are required.",
      });
    }

    const normalizedBase64 = String(contentBase64)
      .replace(DATA_URL_PREFIX_PATTERN, "")
      .replace(/\s/g, "");
    const fileBuffer = Buffer.from(normalizedBase64, "base64");

    if (!fileBuffer.length) {
      return res.status(400).json({
        message: "The uploaded file is empty or invalid.",
      });
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        message: "Please upload a file that is 5 MB or smaller.",
      });
    }

    const extension = path.extname(fileName).toLowerCase();
    const safeBaseName = sanitizeBaseName(fileName) || "file";
    const storedName = `${Date.now()}-${safeBaseName}${extension}`;
    const relativePath = path.posix.join("files", storedName);
    const fullFilePath = path.join(FILES_DIRECTORY, storedName);

    const { extractedText, extractionStatus, extractionError } =
      await extractTextFromBuffer({ fileName, mimeType, buffer: fileBuffer });

    if (extractionStatus === "failed") {
      console.error("OCR/extraction failed for", fileName, "-", extractionError);
    }

    await fs.mkdir(FILES_DIRECTORY, { recursive: true });
    await fs.writeFile(fullFilePath, fileBuffer);

    const savedFile = await UploadedFile.create({
      originalName: path.basename(fileName),
      storedName,
      mimeType: mimeType || "application/octet-stream",
      size: fileBuffer.length,
      extension,
      relativePath,
      extractedText,
      extractionStatus,
      extractedAt: extractionStatus === "completed" ? new Date() : null,
      extractionError,
      uploadedBy: {
        id: req.user?.sub || "",
        username: req.user?.username || "",
        email: req.user?.email || "",
      },
    });

    const fileResponse = await buildAnalyzedFileResponse(req, savedFile);

    return res.status(201).json({
      message: "File uploaded successfully.",
      file: fileResponse,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to upload the file.",
    });
  }
};
