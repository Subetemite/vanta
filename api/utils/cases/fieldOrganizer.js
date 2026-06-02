/**
 * AI Field Organizer
 *
 * Takes cleaned text and produces a richly-structured JSON document:
 *   - documentType classification
 *   - header block (from / to / subject / ref no / date)
 *   - named entity extraction (persons, orgs, locations, dates, money, IDs)
 *   - body / narrative
 *   - suggestedFields (ready to plug into the entry form)
 *   - tags & confidence
 *
 * Pure heuristic — no external API calls. Designed so the same JSON shape
 * can later be produced by an LLM call without changing downstream code.
 *
 * For an LLM-backed version with the same shape, use organizeFieldsAsync()
 * which tries an LLM (if LLM_PROVIDER is configured) and falls back to the
 * heuristic on any error.
 */

const { organizeWithLLM, isLLMEnabled, getProvider } = require("./llmOrganizer");

// ── Knowledge bases ────────────────────────────────────────────────────────
const PH_AGENCIES = [
  // long-form first
  "PNP-CIDG", "PNP-AKG", "PNP-DEG", "PNP-WCPC", "PNP-CIDU", "PNP-SAF",
  "NBI-AHTRAD", "NBI-CCD", "NBI-IPRD", "NBI-AMSWEAD",
  "AFP-ISG", "AFP-WESCOM", "AFP-NOLCOM", "AFP-SOLCOM",
  "BI", "BIR", "BOC", "BOI", "PCG", "PDEA", "AMLC", "NICA", "PSA", "MICC",
  "DOJ", "DILG", "DOTr", "DOTC", "DOST", "DOLE", "DOH", "DSWD",
  "DENR", "DA", "BFAR", "DAR", "DBM", "DOF",
  "PNP", "NBI", "AFP", "SAF",
];

const PH_PROVINCES = [
  "Metro Manila", "NCR", "Cebu", "Davao", "Cavite", "Laguna", "Batangas", "Bulacan",
  "Pampanga", "Rizal", "Pangasinan", "Iloilo", "Negros Occidental", "Zamboanga",
  "Cagayan", "Isabela", "Quezon", "Albay", "Sorsogon", "Camarines Sur",
];

const PH_CITY_HINTS = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:City|Province|Municipality|Town|Barangay|Brgy\.?)\b/g;

const NAME_TITLES = [
  "P/Maj.", "P/Capt.", "P/Lt.", "P/Col.", "P/Gen.", "P/Brig.", "P/Insp.",
  "PSMS", "PEMS", "PMSg.", "Capt.", "Col.", "Gen.", "Maj.", "Lt.", "Atty.",
  "Hon.", "Dr.", "Engr.", "Sec.", "Usec.", "Asec.", "Dir.", "Supt.",
];

const DOC_TYPE_PATTERNS = [
  { type: "memorandum", patterns: [/\bmemorandum\b/i, /\bmemo\b/i] },
  { type: "resolution", patterns: [/\bresolution\s+no\.?/i, /\bbe\s+it\s+resolved\b/i] },
  { type: "order", patterns: [/\bspecial\s+order\b/i, /\bgeneral\s+order\b/i, /\boffice\s+order\b/i] },
  { type: "spot-report", patterns: [/\bspot\s+report\b/i, /\bSPREP\b/] },
  { type: "after-activity-report", patterns: [/\bafter[-\s]activity\s+report\b/i, /\bAAR\b/] },
  { type: "accomplishment-report", patterns: [/\baccomplishment\s+report\b/i, /\bACR\b/] },
  { type: "intel-report", patterns: [/\bintelligence\s+report\b/i, /\bintel\s+report\b/i] },
  { type: "case-folder", patterns: [/\bcase\s+folder\b/i, /\bcase\s+brief\b/i] },
  { type: "letter", patterns: [/\bdear\s+sir\b/i, /\bdear\s+ma'?am\b/i, /\bvery\s+truly\s+yours\b/i] },
];

const STATUS_KEYWORDS = {
  closed: ["closed", "resolved", "concluded", "terminated", "case closed"],
  "in-progress": ["ongoing", "in progress", "in-progress", "for follow-up", "for action", "under investigation"],
  archived: ["archived", "filed away"],
  open: ["open", "active", "for investigation", "pending", "newly filed"],
};

const PRIORITY_KEYWORDS = {
  critical: ["critical", "urgent", "extremely urgent", "top priority", "rush"],
  high: ["high priority", "priority", "important"],
  low: ["low priority", "for information", "for info"],
};

const TAG_KEYWORDS = {
  "drug-related": ["shabu", "marijuana", "methamphetamine", "drug bust", "narcotics", "pdea"],
  "smuggling": ["smuggled", "contraband", "undeclared cargo", "smuggling"],
  "cyber": ["online", "cyber", "phishing", "scam", "social media", "facebook", "telegram"],
  "trafficking": ["trafficking", "illegal recruitment", "tip"],
  "money-laundering": ["money laundering", "amla", "amlc", "suspicious transaction"],
  "gambling": ["pogo", "e-sabong", "online gambling", "illegal gambling"],
  "kidnapping": ["kidnap", "abduction", "ransom"],
  "terrorism": ["terrorist", "ied", "atc", "terrorism"],
  "graft": ["graft", "corruption", "anti-graft", "rico"],
  "firearms": ["firearm", "loose firearm", "gunrunning", "high-powered"],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function escape(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function tryParseDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  // Reject obviously wrong years (OCR garbage)
  const year = d.getFullYear();
  if (year < 1990 || year > 2100) return null;
  return d;
}

// ── Section detection ──────────────────────────────────────────────────────
function splitHeaderBody(text) {
  const lines = text.split("\n");
  let bodyStart = 0;
  // Find the first long paragraph (>= 200 chars on a single line OR a blank
  // line after a block of short header-ish lines)
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    if (lines[i].length >= 200) {
      bodyStart = i;
      break;
    }
    if (lines[i].trim() === "" && i > 4) {
      bodyStart = i + 1;
      break;
    }
  }
  if (bodyStart === 0) bodyStart = Math.min(8, lines.length);
  return {
    header: lines.slice(0, bodyStart).join("\n"),
    body: lines.slice(bodyStart).join("\n"),
  };
}

// ── Header field extraction ────────────────────────────────────────────────
function extractHeaderField(headerText, labelRegex) {
  const match = headerText.match(labelRegex);
  return match ? match[1].trim().replace(/\.+$/, "") : "";
}

function extractHeader(headerText) {
  return {
    from: extractHeaderField(headerText, /(?:^|\n)\s*from\s*[:\-]\s*([^\n]{2,200})/i),
    to: extractHeaderField(headerText, /(?:^|\n)\s*(?:to|attention|attn\.?)\s*[:\-]\s*([^\n]{2,200})/i),
    subject: extractHeaderField(headerText, /(?:^|\n)\s*(?:subject|re|title)\s*[:\-]\s*([^\n]{2,250})/i),
    referenceNo: extractReferenceNo(headerText) || extractReferenceNo(headerText.slice(0, 600)),
    date: extractDates(headerText)[0]?.iso || "",
  };
}

// ── Reference numbers ──────────────────────────────────────────────────────
function extractReferenceNo(text) {
  const labelMatch = text.match(
    /(?:reference\s*(?:no\.?|number)?|ref\.?\s*(?:no\.?)?|case\s*(?:no\.?|number)|control\s*(?:no\.?|number)|docket\s*(?:no\.?|number)|resolution\s*(?:no\.?)?|s\.?o\.?\s*no\.?|order\s*(?:no\.?|number))[:\s#]*([A-Z0-9][A-Z0-9\-/]{2,30})/i
  );
  if (labelMatch) return labelMatch[1].trim();
  const generic = text.match(/\b([A-Z]{2,5}-\d{2,4}-\d{3,6}(?:-[A-Z0-9]+)?)\b/);
  return generic ? generic[1] : "";
}

// ── Dates ──────────────────────────────────────────────────────────────────
function extractDates(text) {
  const found = [];
  const seen = new Set();
  const patterns = [
    /\b(\d{4}-\d{1,2}-\d{1,2})\b/g,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const raw = m[0];
      if (seen.has(raw)) continue;
      seen.add(raw);
      const parsed = tryParseDate(raw);
      if (parsed) {
        found.push({ raw, iso: parsed.toISOString(), date: parsed.toISOString().slice(0, 10) });
      }
    }
  }
  return found;
}

// ── Persons ────────────────────────────────────────────────────────────────
function extractPersons(text) {
  const found = [];
  const seen = new Set();
  // Title + Name pattern — first match wins for "lead"
  const titlePattern = new RegExp(
    `(${NAME_TITLES.map((t) => escape(t)).join("|")})\\s+([A-Z][a-zA-Z'\\.\\-]+(?:\\s+[A-Z][a-zA-Z'\\.\\-]+){1,3})`,
    "g"
  );
  let m;
  while ((m = titlePattern.exec(text)) !== null) {
    const fullName = `${m[1]} ${m[2]}`;
    if (seen.has(fullName)) continue;
    seen.add(fullName);
    found.push({ name: m[2], title: m[1], full: fullName });
    if (found.length >= 10) break;
  }
  // Plain "FIRSTNAME M. LASTNAME" all-caps pattern (signatories)
  const allCapsPattern = /\b([A-Z]{2,}\s+[A-Z]\.?\s+[A-Z]{2,})\b/g;
  while ((m = allCapsPattern.exec(text)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    found.push({ name, title: "", full: name });
    if (found.length >= 12) break;
  }
  return found;
}

// ── Organizations / Agencies ───────────────────────────────────────────────
function extractAgencies(text) {
  const found = [];
  const seen = new Set();
  for (const agency of PH_AGENCIES) {
    const pattern = new RegExp(`\\b${agency.replace(/[-]/g, "[-\\s]?")}\\b`, "i");
    if (pattern.test(text) && !seen.has(agency)) {
      found.push(agency);
      seen.add(agency);
    }
  }
  return found;
}

// ── Locations ──────────────────────────────────────────────────────────────
function extractLocations(text) {
  const found = [];
  const seen = new Set();
  let m;
  PH_CITY_HINTS.lastIndex = 0;
  while ((m = PH_CITY_HINTS.exec(text)) !== null) {
    const loc = m[0].trim();
    if (!seen.has(loc)) {
      found.push(loc);
      seen.add(loc);
    }
    if (found.length >= 8) break;
  }
  for (const province of PH_PROVINCES) {
    const pattern = new RegExp(`\\b${escape(province)}\\b`, "i");
    if (pattern.test(text) && !seen.has(province)) {
      found.push(province);
      seen.add(province);
    }
  }
  return found;
}

// ── Money ──────────────────────────────────────────────────────────────────
function extractMonetary(text) {
  const found = [];
  const seen = new Set();
  const patterns = [
    // PHP / ₱ / Php prefixed
    /(?:₱|PHP|Php|P\$?)\s?([\d,]+(?:\.\d{1,2})?)/g,
    // "Pesos" / "peso" suffix
    /\b([\d,]+(?:\.\d{1,2})?)\s+pesos?\b/gi,
    // USD
    /(?:US\$?|USD|\$)\s?([\d,]+(?:\.\d{1,2})?)/g,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const raw = m[0];
      if (seen.has(raw)) continue;
      seen.add(raw);
      const numeric = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(numeric) && numeric > 0) {
        const currency = /\$|US/i.test(raw) && !/PHP|Php|P\$|peso/i.test(raw) ? "USD" : "PHP";
        found.push({ raw: raw.trim(), amount: numeric, currency });
      }
      if (found.length >= 12) break;
    }
  }
  return found;
}

// ── Identifier numbers (case no, badge no, etc.) ───────────────────────────
function extractIdentifiers(text) {
  const found = [];
  const labelled = [
    { type: "case-no", regex: /\bcase\s*(?:no\.?|number)\s*[:#]?\s*([A-Z0-9\-/]+)/gi },
    { type: "docket-no", regex: /\bdocket\s*(?:no\.?|number)\s*[:#]?\s*([A-Z0-9\-/]+)/gi },
    { type: "control-no", regex: /\bcontrol\s*(?:no\.?|number)\s*[:#]?\s*([A-Z0-9\-/]+)/gi },
    { type: "ic-no", regex: /\bIC\s*(?:no\.?|number)\s*[:#]?\s*([A-Z0-9\-/]+)/gi },
    { type: "badge-no", regex: /\bbadge\s*(?:no\.?|number)\s*[:#]?\s*([A-Z0-9\-/]+)/gi },
  ];
  for (const { type, regex } of labelled) {
    let m;
    while ((m = regex.exec(text)) !== null) {
      found.push({ type, value: m[1] });
      if (found.length >= 8) break;
    }
  }
  return found;
}

// ── Document classification ────────────────────────────────────────────────
function classifyDocument(text) {
  for (const { type, patterns } of DOC_TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return "unknown";
}

// ── Status / priority / tags ───────────────────────────────────────────────
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
  const tags = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) tags.push(tag);
  }
  return tags;
}

// ── Action items ───────────────────────────────────────────────────────────
function extractActionItems(text) {
  const items = [];
  const lines = text.split(/\n|(?<=\.)\s+(?=[A-Z])/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8 || trimmed.length > 240) continue;
    if (/^\s*(?:\d+\.|\*|-|•)\s+/.test(trimmed)) {
      items.push(trimmed.replace(/^\s*(?:\d+\.|\*|-|•)\s+/, ""));
    } else if (/^(?:please|kindly|ensure|conduct|coordinate|submit|provide|report|investigate)/i.test(trimmed)) {
      items.push(trimmed);
    }
    if (items.length >= 10) break;
  }
  return items;
}

// ── Title resolver ─────────────────────────────────────────────────────────
function resolveTitle(header, body) {
  if (header.subject) return header.subject;
  // First non-empty line of body that's substantive
  const firstLine = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length >= 10 && l.length <= 200 && !/^(?:from|to|subject|re|date)\s*[:\-]/i.test(l));
  return firstLine ? firstLine.slice(0, 200) : "";
}

// ── Confidence scoring ─────────────────────────────────────────────────────
function scoreConfidence(suggested) {
  let score = 0;
  let max = 0;
  const fields = ["title", "referenceNo", "leadAgency", "location", "occurredAt"];
  for (const f of fields) {
    max += 1;
    if (suggested[f]) score += 1;
  }
  return max ? Number((score / max).toFixed(2)) : 0;
}

// ── Main ───────────────────────────────────────────────────────────────────
exports.organizeFields = function organizeFields(cleanedText) {
  const text = String(cleanedText || "").trim();
  if (!text) return null;

  const { header: headerText, body: bodyText } = splitHeaderBody(text);
  const header = extractHeader(headerText);
  const persons = extractPersons(text);
  const agencies = extractAgencies(text);
  const locations = extractLocations(text);
  const dates = extractDates(text);
  const monetary = extractMonetary(text);
  const ids = extractIdentifiers(text);
  const status = extractStatus(text);
  const priority = extractPriority(text);
  const tags = extractTags(text);
  const actionItems = extractActionItems(bodyText);
  const documentType = classifyDocument(text);

  const leadAgency = agencies[0] || "";
  const coordinatingAgencies = agencies.slice(1, 6);
  const occurredAt = header.date || dates[0]?.iso || "";
  const title = resolveTitle(header, bodyText);
  const referenceNo = header.referenceNo;
  const location = locations[0] || "";
  const description = bodyText.slice(0, 2000);

  const suggestedFields = {
    title,
    referenceNo,
    leadAgency,
    coordinatingAgencies,
    location,
    occurredAt,
    reportedAt: occurredAt,
    status,
    priority,
    description,
    tags: uniq(tags),
  };

  const confidence = scoreConfidence(suggestedFields);

  return {
    documentType,
    header,
    entities: {
      persons,
      organizations: agencies,
      locations,
      dates,
      monetary,
      ids,
    },
    body: bodyText.slice(0, 4000),
    actionItems,
    suggestedFields: Object.fromEntries(
      Object.entries(suggestedFields).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== "" && v != null;
      })
    ),
    confidence,
  };
};

// ── LLM-backed wrapper ─────────────────────────────────────────────────────
// Tries the configured LLM (LLM_PROVIDER env), falls back to heuristic on any
// error. Returns the SAME JSON shape as organizeFields() so callers don't
// need to branch.

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function nonEmpty(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (isPlainObject(v)) return Object.keys(v).length > 0;
  return true;
}

// LLM wins for any field it provides; heuristic fills gaps the LLM left empty.
function mergeOrganized(llm, heuristic) {
  if (!llm || typeof llm !== "object") return heuristic;
  if (!heuristic) return llm;

  const merged = { ...heuristic, ...llm };

  // header — per-key fill-in
  merged.header = { ...(heuristic.header || {}) };
  for (const [key, value] of Object.entries(llm.header || {})) {
    if (nonEmpty(value)) merged.header[key] = value;
  }

  // entities — prefer LLM list when non-empty, otherwise heuristic
  const hEnt = heuristic.entities || {};
  const lEnt = llm.entities || {};
  merged.entities = {
    persons: nonEmpty(lEnt.persons) ? lEnt.persons : hEnt.persons || [],
    organizations: nonEmpty(lEnt.organizations) ? lEnt.organizations : hEnt.organizations || [],
    locations: nonEmpty(lEnt.locations) ? lEnt.locations : hEnt.locations || [],
    dates: nonEmpty(lEnt.dates) ? lEnt.dates : hEnt.dates || [],
    monetary: nonEmpty(lEnt.monetary) ? lEnt.monetary : hEnt.monetary || [],
    ids: nonEmpty(lEnt.ids) ? lEnt.ids : hEnt.ids || [],
  };

  // suggestedFields — strip empties, then merge LLM over heuristic
  const hFields = heuristic.suggestedFields || {};
  const lFields = {};
  for (const [k, v] of Object.entries(llm.suggestedFields || {})) {
    if (nonEmpty(v)) lFields[k] = v;
  }
  merged.suggestedFields = { ...hFields, ...lFields };

  // arrays where LLM might be empty
  if (!nonEmpty(merged.actionItems)) merged.actionItems = heuristic.actionItems || [];
  if (!nonEmpty(merged.body)) merged.body = heuristic.body || "";
  if (!nonEmpty(merged.documentType) || merged.documentType === "unknown") {
    merged.documentType = heuristic.documentType || "unknown";
  }
  if (typeof merged.confidence !== "number") merged.confidence = heuristic.confidence ?? 0;

  return merged;
}

exports.organizeFieldsAsync = async function organizeFieldsAsync(cleanedText) {
  const heuristic = exports.organizeFields(cleanedText);
  if (!heuristic) return null;

  if (!isLLMEnabled()) {
    return { ...heuristic, source: "heuristic" };
  }

  try {
    const llm = await organizeWithLLM(cleanedText);
    if (!llm) return { ...heuristic, source: "heuristic" };
    const merged = mergeOrganized(llm, heuristic);
    return { ...merged, source: `llm:${getProvider()}` };
  } catch (error) {
    console.error("[fieldOrganizer] LLM organize failed, using heuristic:", error.message);
    return { ...heuristic, source: "heuristic", llmError: error.message };
  }
};
