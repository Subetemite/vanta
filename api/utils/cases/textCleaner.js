/**
 * Cleans raw OCR / PDF-extracted text before downstream field organization.
 *
 * Steps:
 *   1. Strip non-printable / control chars
 *   2. Normalize Unicode quotes, dashes, ellipses
 *   3. De-hyphenate words broken across lines (e.g. "crimi-\nnal" -> "criminal")
 *   4. Collapse repeated whitespace, normalize line endings
 *   5. Drop obvious noise lines (page numbers, headers/footers that repeat)
 *   6. Repair common OCR confusables in identifiers (l<->1, O<->0) only inside
 *      reference-number-like tokens, NOT inside arbitrary words
 */

const NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const SOFT_HYPHEN = /­/g;
const SMART_QUOTES = /[‘’‚‛]/g;
const SMART_DOUBLE_QUOTES = /[“”„‟]/g;
const EM_DASH = /—/g;
const EN_DASH = /–/g;
const ELLIPSIS = /…/g;
const NBSP = / /g;

const PAGE_FOOTER_PATTERN = /^\s*(?:page\s+)?\d+\s*(?:of\s+\d+)?\s*$/i;
const URL_LINE_PATTERN = /^https?:\/\/\S+$/i;

function stripControlChars(text) {
  return text.replace(NON_PRINTABLE, "").replace(SOFT_HYPHEN, "");
}

function normalizeUnicode(text) {
  return text
    .replace(NBSP, " ")
    .replace(SMART_QUOTES, "'")
    .replace(SMART_DOUBLE_QUOTES, '"')
    .replace(EM_DASH, " -- ")
    .replace(EN_DASH, "-")
    .replace(ELLIPSIS, "...");
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * Joins words split across lines by a trailing hyphen.
 * "crimi-\nnal" -> "criminal" (when the next char is lowercase).
 * Leaves intentional hyphenated compounds alone (capitalized after dash).
 */
function dehyphenate(text) {
  return text.replace(/(\w)-\n\s*(\w)/g, (match, before, after) => {
    if (after === after.toLowerCase()) return `${before}${after}`;
    return `${before}-${after}`;
  });
}

function collapseWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Removes lines that look like page-number footers, lone URLs, or repeated
 * header/footer fingerprints (a line that appears 3+ times across the doc).
 */
function dropNoiseLines(text) {
  const lines = text.split("\n");
  const counts = new Map();
  for (const line of lines) {
    const key = line.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return lines
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // keep blank lines for paragraph structure
      if (PAGE_FOOTER_PATTERN.test(trimmed)) return false;
      if (URL_LINE_PATTERN.test(trimmed)) return false;
      // Line repeats 3+ times AND is short — likely a running header/footer
      if (counts.get(trimmed) >= 3 && trimmed.length < 80) return false;
      return true;
    })
    .join("\n");
}

/**
 * Repairs common OCR substitutions inside ID-shaped tokens only:
 *   "lD-2O24-OO1" -> "ID-2024-001"
 * Only touches tokens that look like reference numbers; leaves prose untouched.
 */
function repairIdentifiers(text) {
  return text.replace(/\b([A-Z0-9OlIS][A-Z0-9OlIS\-/]{4,})\b/g, (token) => {
    if (!/[OlIS]/.test(token)) return token;
    return token
      .split("")
      .map((ch, i, arr) => {
        const prev = arr[i - 1];
        const next = arr[i + 1];
        const surroundingDigit = /\d/.test(prev || "") || /\d/.test(next || "");
        if (!surroundingDigit) return ch;
        if (ch === "O") return "0";
        if (ch === "l" || ch === "I") return "1";
        if (ch === "S") return "5";
        return ch;
      })
      .join("");
  });
}

/**
 * Trims runs of identical characters that OCR sometimes inserts ("aaaaaaaa").
 * Limits any run of the same letter/punct to 4.
 */
function trimRepetition(text) {
  return text.replace(/(.)\1{4,}/g, (_, ch) => ch.repeat(4));
}

exports.cleanText = function cleanText(rawText) {
  if (!rawText) return "";
  let text = String(rawText);
  text = stripControlChars(text);
  text = normalizeUnicode(text);
  text = normalizeLineEndings(text);
  text = dehyphenate(text);
  text = collapseWhitespace(text);
  text = dropNoiseLines(text);
  text = repairIdentifiers(text);
  text = trimRepetition(text);
  text = collapseWhitespace(text);
  return text.trim();
};

exports._internals = {
  stripControlChars,
  normalizeUnicode,
  normalizeLineEndings,
  dehyphenate,
  collapseWhitespace,
  dropNoiseLines,
  repairIdentifiers,
  trimRepetition,
};
