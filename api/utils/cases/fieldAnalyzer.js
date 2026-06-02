/**
 * Heuristic field extraction for OCR'd document text.
 * Returns a partial CaseEntry shape — only fields we could detect with reasonable
 * confidence. Frontend treats these as suggestions, not hard values.
 */

const KNOWN_AGENCIES = [
  // Long-form first so they win over their abbreviations.
  "PNP-CIDG", "PNP-AKG", "PNP-DEG", "PNP-WCPC", "PNP-CIDU",
  "NBI-AHTRAD", "NBI-CCD", "NBI-IPRD",
  "AFP-ISG", "AFP-WESCOM",
  "BI", "BIR", "BOC", "BOI",
  "PCG", "PDEA", "AMLC", "NICA", "PSA", "MICC",
  "DOJ", "DILG", "DOTr", "DOTC", "DOST", "DOLE", "DOH", "DSWD",
  "DENR", "DA", "BFAR", "DAR",
  "PNP", "NBI", "AFP", "PNP-SAF", "SAF",
];

const STATUS_KEYWORDS = {
  closed: ["closed", "resolved", "concluded", "terminated"],
  "in-progress": ["ongoing", "in progress", "in-progress", "for follow-up", "for action"],
  archived: ["archived", "filed away"],
  open: ["open", "active", "for investigation", "pending"],
};

const PRIORITY_KEYWORDS = {
  critical: ["critical", "urgent", "extremely urgent", "top priority"],
  high: ["high priority", "priority", "important"],
  low: ["low priority", "for information"],
};

const REFERENCE_PATTERNS = [
  /(?:reference\s*(?:no\.?|number)?|ref\.?\s*(?:no\.?)?|case\s*(?:no\.?|number)|control\s*(?:no\.?|number)|docket\s*(?:no\.?|number))[:\s#]*([A-Z0-9][A-Z0-9\-/]{2,30})/i,
  /\b([A-Z]{2,5}-\d{2,4}-\d{3,6})\b/, // Generic XX-YYYY-NNNN
];

const DATE_PATTERNS = [
  // 2024-04-26
  /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/,
  // 04/26/2024
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
  // April 26, 2024
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  // 26 April 2024
  /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
];

function tryParseDate(matchText) {
  const parsed = new Date(matchText);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

function findFirstMeaningfulLine(text) {
  const lines = text
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8 && line.length <= 200)
    .filter((line) => !/^(page\s*\d+|confidential|memorandum|memo|subject|to:|from:)$/i.test(line));
  return lines[0] || "";
}

function extractReferenceNo(text) {
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return (match[1] || match[0]).trim();
  }
  return "";
}

function extractDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = tryParseDate(match[0]);
      if (parsed) return parsed;
    }
  }
  return null;
}

function extractAgency(text) {
  const upperText = text.toUpperCase();
  for (const agency of KNOWN_AGENCIES) {
    const pattern = new RegExp(`\\b${agency.replace(/[-]/g, "[-\\s]?")}\\b`, "i");
    if (pattern.test(upperText)) return agency;
  }
  return "";
}

function extractCoordinatingAgencies(text, lead) {
  const found = new Set();
  const upperText = text.toUpperCase();
  for (const agency of KNOWN_AGENCIES) {
    const pattern = new RegExp(`\\b${agency.replace(/[-]/g, "[-\\s]?")}\\b`, "i");
    if (pattern.test(upperText) && agency !== lead) found.add(agency);
  }
  return Array.from(found).slice(0, 5);
}

function extractTitle(text) {
  // Prefer "Subject:" or "Re:" line
  const subjectMatch = text.match(/(?:^|\n)\s*(?:subject|re|title)\s*[:\-]\s*([^\n\r]{6,200})/i);
  if (subjectMatch) return subjectMatch[1].trim().replace(/\.$/, "");
  return findFirstMeaningfulLine(text).slice(0, 160);
}

function extractLocation(text) {
  // City + Province (PH context): "Quezon City", "Cebu City", "Davao Del Sur", "Manila"
  const cityMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:City|Province|Municipality))\b/);
  if (cityMatch) return cityMatch[1].trim();
  return "";
}

function extractStatus(text) {
  const lower = text.toLowerCase();
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return status;
  }
  return "";
}

function extractPriority(text) {
  const lower = text.toLowerCase();
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return priority;
  }
  return "";
}

function extractTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();
  const tagKeywords = {
    "drug-related": ["shabu", "marijuana", "methamphetamine", "drug bust", "narcotics"],
    "smuggling": ["smuggled", "contraband", "undeclared cargo"],
    "cyber": ["online", "cyber", "phishing", "scam", "social media"],
    "trafficking": ["trafficking", "illegal recruitment"],
    "money-laundering": ["money laundering", "amla"],
    "gambling": ["pogo", "e-sabong", "online gambling"],
    "kidnapping": ["kidnap", "abduction", "ransom"],
    "terrorism": ["terrorist", "ied", "atc"],
    "graft": ["graft", "corruption", "anti-graft"],
  };
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) tags.add(tag);
  }
  return Array.from(tags);
}

exports.analyzeFields = function analyzeFields(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return {};

  const lead = extractAgency(text);
  const fields = {
    title: extractTitle(text),
    referenceNo: extractReferenceNo(text),
    leadAgency: lead,
    coordinatingAgencies: extractCoordinatingAgencies(text, lead),
    location: extractLocation(text),
    status: extractStatus(text),
    priority: extractPriority(text),
    tags: extractTags(text),
  };
  const date = extractDate(text);
  if (date) {
    fields.occurredAt = date;
    fields.reportedAt = date;
  }

  // Strip empties
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== "" && v != null;
    })
  );
};
