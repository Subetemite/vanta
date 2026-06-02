/**
 * LLM-powered field organizer.
 *
 * Drop-in upgrade for the heuristic organizeFields(): produces the SAME JSON
 * shape (documentType, header, entities, body, actionItems, suggestedFields,
 * confidence) but uses a real language model so it handles ambiguous layouts,
 * odd whitespace, multi-language docs, and unusual document types.
 *
 * Providers (selected via env LLM_PROVIDER):
 *   - "anthropic"  → Claude Messages API (default model: claude-haiku-4-5)
 *   - "openai"     → Chat Completions w/ JSON mode
 *   - "ollama"     → Local Ollama daemon, JSON format
 *
 * If LLM_PROVIDER is unset or the provider call fails, callers should fall
 * back to the heuristic organizeFields().
 *
 * No SDKs — uses native fetch (Node 18+).
 */

const PROVIDER = String(process.env.LLM_PROVIDER || "").toLowerCase().trim();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
// num_gpu controls GPU layer offload. Default unset → Ollama auto-picks. Set
// 0 to force CPU-only (use when model > VRAM, otherwise the runner crashes).
const OLLAMA_NUM_GPU =
  process.env.OLLAMA_NUM_GPU !== undefined && process.env.OLLAMA_NUM_GPU !== ""
    ? Number(process.env.OLLAMA_NUM_GPU)
    : null;

const REQUEST_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 45000);
const MAX_INPUT_CHARS = 24000; // ≈ 6k tokens of source text — keeps cost predictable

const SYSTEM_PROMPT = `You are an investigative document analyst for a Philippine law-enforcement / case-monitoring platform. You receive raw OCR / PDF text from operational documents (memoranda, spot reports, after-activity reports, intel reports, resolutions, orders, case folders, letters) and you must return a STRICT JSON object that organizes the document into named fields.

Return JSON ONLY — no prose, no markdown, no code fences. The JSON must match this schema exactly:

{
  "documentType": "memorandum" | "resolution" | "order" | "spot-report" | "after-activity-report" | "accomplishment-report" | "intel-report" | "case-folder" | "letter" | "unknown",
  "header": {
    "from": string,            // sender / originating office, "" if unknown
    "to": string,              // recipient / addressee, "" if unknown
    "subject": string,         // subject line / "Re:" / "Title:", "" if unknown
    "referenceNo": string,     // case/ref/control/docket number, "" if unknown
    "date": string             // ISO 8601 date of the document header, "" if unknown
  },
  "entities": {
    "persons": [{ "name": string, "title": string, "full": string }],
    "organizations": [string], // agencies and offices mentioned (PNP, NBI, DOJ, etc.)
    "locations": [string],     // PH cities/provinces/barangays mentioned
    "dates": [{ "raw": string, "iso": string, "date": string }],   // every date found; date is YYYY-MM-DD
    "monetary": [{ "raw": string, "amount": number, "currency": "PHP" | "USD" }],
    "ids": [{ "type": string, "value": string }]                   // case-no | docket-no | control-no | ic-no | badge-no | other
  },
  "body": string,              // narrative body, up to ~4000 chars
  "actionItems": [string],     // imperative directives / next steps
  "suggestedFields": {
    "title": string,
    "referenceNo": string,
    "leadAgency": string,
    "coordinatingAgencies": [string],
    "location": string,
    "occurredAt": string,      // ISO 8601
    "reportedAt": string,      // ISO 8601
    "status": "open" | "in-progress" | "closed" | "archived" | "",
    "priority": "critical" | "high" | "low" | "",
    "description": string,
    "tags": [string]           // e.g. drug-related, smuggling, cyber, trafficking, money-laundering, gambling, kidnapping, terrorism, graft, firearms
  },
  "confidence": number         // 0..1 — your honest confidence in suggestedFields
}

Rules:
- Output JSON only. No commentary. No trailing text.
- Omit no keys; use "" / [] / 0 for missing values, but keep all keys present.
- Dates MUST be valid ISO 8601 (YYYY-MM-DD or full ISO). If a year looks like OCR garbage (< 1990 or > 2100), drop the date.
- Do not invent agencies, persons, ref numbers, or amounts that are not in the source text.
- Prefer Philippine context: PNP, NBI, AFP, DOJ, BI, PDEA, AMLC, BOC, PCG, etc., and barangay/municipality/city/province naming.
- "leadAgency" is the originating or primary investigating agency. "coordinatingAgencies" are the others.
- Keep "body" to the substantive narrative — strip headers, signatories, page numbers.`;

function isLLMEnabled() {
  if (PROVIDER === "anthropic") return Boolean(ANTHROPIC_API_KEY);
  if (PROVIDER === "openai") return Boolean(OPENAI_API_KEY);
  if (PROVIDER === "ollama") return true;
  return false;
}

function getProvider() {
  return PROVIDER;
}

function truncateInput(text) {
  const str = String(text || "");
  if (str.length <= MAX_INPUT_CHARS) return str;
  return str.slice(0, MAX_INPUT_CHARS) + "\n\n[... truncated ...]";
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function extractJsonObject(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  // Strip ``` fences if the model insists on them
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  // Locate the outermost { ... } block
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonSlice = unfenced.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    return null;
  }
}

function buildUserMessage(cleanedText) {
  return `Analyze the document below and return the JSON object described in the system prompt.\n\n=== DOCUMENT TEXT ===\n${truncateInput(cleanedText)}\n=== END ===`;
}

async function callAnthropic(cleanedText) {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: buildUserMessage(cleanedText) }],
      },
    ],
  };

  const response = await withTimeout(
    fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    }),
    REQUEST_TIMEOUT_MS,
    "Anthropic"
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Anthropic ${response.status}: ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return extractJsonObject(text);
}

async function callOpenAI(cleanedText) {
  const body = {
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(cleanedText) },
    ],
  };

  const response = await withTimeout(
    fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    }),
    REQUEST_TIMEOUT_MS,
    "OpenAI"
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenAI ${response.status}: ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return extractJsonObject(text);
}

async function callOllama(cleanedText) {
  const options = { temperature: 0 };
  if (OLLAMA_NUM_GPU !== null && Number.isFinite(OLLAMA_NUM_GPU)) {
    options.num_gpu = OLLAMA_NUM_GPU;
  }
  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    format: "json",
    options,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(cleanedText) },
    ],
  };

  const response = await withTimeout(
    fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    REQUEST_TIMEOUT_MS,
    "Ollama"
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Ollama ${response.status}: ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data.message?.content || "";
  return extractJsonObject(text);
}

async function organizeWithLLM(cleanedText) {
  if (!isLLMEnabled()) return null;
  if (!cleanedText || !cleanedText.trim()) return null;

  if (PROVIDER === "anthropic") return callAnthropic(cleanedText);
  if (PROVIDER === "openai") return callOpenAI(cleanedText);
  if (PROVIDER === "ollama") return callOllama(cleanedText);
  return null;
}

module.exports = {
  organizeWithLLM,
  isLLMEnabled,
  getProvider,
};
