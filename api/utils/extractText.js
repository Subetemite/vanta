const path = require("path");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const engData = require("@tesseract.js-data/eng");

const PDF_TEXT_THRESHOLD = 40;
const OCR_BATCH_SIZE = 3;
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"];

let ocrWorkerPromise = null;

function normalize(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

async function getWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker("eng", 1, {
      langPath: engData.langPath,
      gzip: engData.gzip,
    }).catch((error) => {
      ocrWorkerPromise = null;
      throw error;
    });
  }
  return ocrWorkerPromise;
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const direct = await parser.getText();
    const directText = normalize(direct.text);
    if (directText.length >= PDF_TEXT_THRESHOLD) return directText;

    const info = await parser.getInfo();
    const totalPages = Number(info?.total) || 0;
    const worker = await getWorker();
    const chunks = [];

    for (let start = 1; start <= totalPages; start += OCR_BATCH_SIZE) {
      const last = Math.min(start + OCR_BATCH_SIZE - 1, totalPages);
      const screenshot = await parser.getScreenshot({
        first: start,
        last,
        scale: 1.5,
        imageBuffer: true,
        imageDataUrl: false,
      });
      for (const page of screenshot.pages || []) {
        if (!page?.data?.length) continue;
        const { data: { text } } = await worker.recognize(Buffer.from(page.data));
        const piece = normalize(text);
        if (piece) chunks.push(piece);
      }
    }
    return normalize([directText, chunks.join(" ")].filter(Boolean).join(" "));
  } finally {
    await parser.destroy();
  }
}

async function extractImage(buffer) {
  const worker = await getWorker();
  const { data: { text } } = await worker.recognize(buffer);
  return normalize(text);
}

/**
 * Run text extraction on a file buffer.
 * Returns { extractedText, extractionStatus, extractionError, scanned }.
 *   - PDFs: pdf-parse first, OCR fallback for image-only PDFs.
 *   - Images: Tesseract OCR.
 *   - Others: not_applicable, no scanning.
 */
async function extractTextFromBuffer({ fileName = "", mimeType = "", buffer }) {
  const ext = path.extname(fileName).toLowerCase();
  const isPdf = ext === ".pdf" || mimeType === "application/pdf";
  const isImage =
    (mimeType && mimeType.startsWith("image/")) || IMAGE_EXTENSIONS.includes(ext);

  if (isPdf) {
    try {
      const extractedText = await extractPdf(buffer);
      return { extractedText, extractionStatus: "completed", extractionError: "", scanned: true };
    } catch (error) {
      return {
        extractedText: "",
        extractionStatus: "failed",
        extractionError: error.message || "Unable to extract PDF text.",
        scanned: true,
      };
    }
  }

  if (isImage) {
    try {
      const extractedText = await extractImage(buffer);
      return { extractedText, extractionStatus: "completed", extractionError: "", scanned: true };
    } catch (error) {
      return {
        extractedText: "",
        extractionStatus: "failed",
        extractionError: error.message || "Unable to scan the image.",
        scanned: true,
      };
    }
  }

  return { extractedText: "", extractionStatus: "not_applicable", extractionError: "", scanned: false };
}

module.exports = { extractTextFromBuffer, normalize };
