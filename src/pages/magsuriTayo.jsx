// ─────────────────────────────────────────────────────────────────────────────
//  E-Panisuri — AI Document Summarizer (Enhanced)
//  API: Groq (llama-3.3-70b-versatile)
//  Key loaded from env — no user input required
//  Features:
//    • Chunked processing for large documents (no truncation)
//    • Multi-chunk merge summarization
//    • Retry with exponential backoff on rate limit / server errors
//    • Progress tracking per chunk
//    • Scanned PDF detection
//    • Empty / image-only document detection
//    • All file validation edge cases handled
//    • Daily rate limit (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import * as mammoth from "mammoth";
import "./magsuriTayo.css";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL     = "llama-3.3-70b-versatile";
const GROQ_API_URL   = "https://api.groq.com/openai/v1/chat/completions";
const MAX_FILE_BYTES = 20 * 1024 * 1024;        // 20 MB
const DAILY_LIMIT    = 15;
const RATE_KEY       = "ms_rate";

// Characters per chunk sent to the model (~12k tokens each, safe for 32k ctx)
const CHUNK_SIZE     = 6_000;
// Max chunks before we do a hierarchical merge instead of one big merge prompt
const MAX_CHUNKS     = 20;

const LOADING_MSGS = [
  "Binabasa ang dokumento...",
  "Sinusuri ang nilalaman...",
  "Ginagawa ang buod...",
  "Pinoproseso ang mga seksyon...",
  "Pinagsasama ang mga resulta...",
  "Halos tapos na...",
];

// ─────────────────────────────────────────────────────────────────────────────
//  RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getRateData() {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return { date: "", count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: "", count: 0 };
  }
}

function getRemainingRequests() {
  const { date, count } = getRateData();
  if (date !== getTodayStr()) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - count);
}

function consumeRequest() {
  const today = getTodayStr();
  const data  = getRateData();
  const count = data.date === today ? data.count : 0;
  if (count >= DAILY_LIMIT) return false;
  localStorage.setItem(RATE_KEY, JSON.stringify({ date: today, count: count + 1 }));
  return true;
}

function refundRequest() {
  try {
    const today = getTodayStr();
    const data  = getRateData();
    if (data.date === today && data.count > 0) {
      localStorage.setItem(RATE_KEY, JSON.stringify({ date: today, count: data.count - 1 }));
    }
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEXT CHUNKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split text into chunks of ~CHUNK_SIZE characters, breaking on paragraph
 * boundaries where possible to avoid cutting mid-sentence.
 */
function chunkText(text, chunkSize = CHUNK_SIZE) {
  if (text.length <= chunkSize) return [text];

  const chunks  = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to find a paragraph break near the chunk boundary
    let splitAt = chunkSize;
    const paraBreak = remaining.lastIndexOf("\n\n", chunkSize);
    if (paraBreak > chunkSize * 0.5) splitAt = paraBreak;
    else {
      // Fall back to sentence boundary
      const sentBreak = remaining.lastIndexOf(". ", chunkSize);
      if (sentBreak > chunkSize * 0.5) splitAt = sentBreak + 1;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
//  RETRY WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call an async fn up to `maxAttempts` times.
 * Retries on 429 (rate limit) and 5xx (server errors) with exponential backoff.
 */
async function withRetry(fn, maxAttempts = 4, baseDelayMs = 1500) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable =
        err?.status === 429 ||
        (err?.status >= 500 && err?.status < 600) ||
        err?.message?.includes("rate") ||
        err?.message?.includes("server") ||
        err?.message?.includes("timeout");

      if (!isRetryable || attempt === maxAttempts - 1) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GROQ API
// ─────────────────────────────────────────────────────────────────────────────

async function callGroq(messages, maxTokens = 10000) {
  const res = await withRetry(async () => {
    const r = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.35,
        max_tokens:  maxTokens,
        messages,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const e   = new Error(err.error?.message || `Groq error ${r.status}`);
      e.status  = r.status;
      if (r.status === 401)
        e.message = "API key error. Makipag-ugnayan sa admin.";
      else if (r.status === 429)
        e.message = "Rate limited ng Groq. Sandaling hintay...";
      throw e;
    }

    return r.json();
  });

  return res.choices?.[0]?.message?.content?.trim() || "";
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYSTEM PROMPT FACTORY
// ─────────────────────────────────────────────────────────────────────────────

function systemPrompt(lang) {
  const langNote =
    lang === "fil"
      ? "Laging isulat ang lahat ng output sa Filipino/Tagalog."
      : "Always write all output in English.";
  return `Ikaw ay isang expert document analyst at summarizer. ${langNote}
Maging detalyado, organisado, at komprehensibo. Huwag mag-alinlangan na magbigay ng mahahabang sagot kung kinakailangan.
Huwag gumamit ng labis na repetition. Tiyaking bawat punto ay mahalaga at may laman.`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUMMARIZE: SINGLE CHUNK
// ─────────────────────────────────────────────────────────────────────────────

async function summarizeChunk(chunk, chunkIndex, totalChunks, fileName, lang) {
  const isOnly  = totalChunks === 1;
  const partNote = isOnly
    ? ""
    : `\n\nIto ay bahagi ${chunkIndex + 1} ng ${totalChunks} ng dokumento. I-extract ang lahat ng mahahalagang impormasyon mula sa seksyong ito.`;

  const prompt = isOnly
    ? fullSummaryPrompt(chunk, fileName, lang)
    : `I-extract at i-summarize ang lahat ng mahahalagang impormasyon mula sa seksyong ito ng dokumento "${fileName}":${partNote}

Kasama:
- Lahat ng mahahalagang puntos at argumento
- Mga espesipikong datos, numero, petsa, pangalan
- Mga konklusyon o rekomendasyon sa seksyong ito
- Anumang kontekstong mahalaga

Maging detalyado — ang lahat ng impormasyon dito ay ipapasa sa susunod na hakbang ng pagsusuri.

---NILALAMAN---
${chunk}`;

  return callGroq(
    [
      { role: "system", content: systemPrompt(lang) },
      { role: "user",   content: prompt },
    ],
    4096
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUMMARIZE: MERGE CHUNK SUMMARIES
// ─────────────────────────────────────────────────────────────────────────────

async function mergeSummaries(chunkSummaries, fileName, lang) {
  const combined = chunkSummaries
    .map((s, i) => `=== BAHAGI ${i + 1} ===\n${s}`)
    .join("\n\n");

  const prompt = `Narito ang mga buod mula sa bawat bahagi ng dokumento "${fileName}".
Pagsamahin at gawing isang komprehensibo, organisadong buod ang lahat ng impormasyon.

${fullSummaryStructure(fileName)}

---MGA BAHAGI---
${combined}`;

  return callGroq(
    [
      { role: "system", content: systemPrompt(lang) },
      { role: "user",   content: prompt },
    ],
    8192
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL SUMMARY PROMPT (single-pass)
// ─────────────────────────────────────────────────────────────────────────────

function fullSummaryStructure(fileName) {
  return `Gawin ang isang malinaw, komprehensibo, at DETALYADONG buod ng dokumentong ito: "${fileName}"

Kasama ang lahat ng sumusunod na seksyon:

1. **Pangunahing Paksa** — Ano ang tungkol sa dokumento? Ipaliwanag nang buong-buo.

2. **Konteksto at Layunin** — Bakit ginawa ang dokumentong ito? Para kanino ito?

3. **Mahahalagang Puntos** — Listahan ang LAHAT ng mahahalagang punto. Bawat punto ay may maikling paliwanag.

4. **Mahahalagang Detalye** — Mga espesipikong impormasyon: numero, petsa, pangalan, datos.

5. **Konklusyon at Rekomendasyon** — Ano ang pangunahing takeaway? May mga rekomendasyon ba?

6. **Pangkalahatang Pagtatasa** — Ano ang kahalagahan ng dokumentong ito?

Maging detalyado. Huwag mag-iwan ng mahalagang impormasyon.`;
}

function fullSummaryPrompt(text, fileName, lang) {
  return `${fullSummaryStructure(fileName)}

---DOKUMENTO---
${text}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main summarization pipeline:
 *  1. Split text into chunks
 *  2. Summarize each chunk independently (with progress callback)
 *  3. If multiple chunks → merge into one final summary
 *  4. Returns { summary, chunkCount, wordCount }
 */
async function summarizeDocument(text, fileName, lang, onProgress) {
  const chunks = chunkText(text);
  const total  = chunks.length;

  onProgress({ phase: "chunking", done: 0, total });

  if (total === 1) {
    onProgress({ phase: "summarizing", done: 0, total: 1 });
    const summary = await summarizeChunk(chunks[0], 0, 1, fileName, lang);
    onProgress({ phase: "done", done: 1, total: 1 });
    return summary;
  }

  // Summarize each chunk
  const partials = [];
  for (let i = 0; i < total; i++) {
    onProgress({ phase: "summarizing", done: i, total });
    const partial = await summarizeChunk(chunks[i], i, total, fileName, lang);
    partials.push(partial);
    onProgress({ phase: "summarizing", done: i + 1, total });
  }

  // Merge
  onProgress({ phase: "merging", done: total, total });
  const final = await mergeSummaries(partials, fileName, lang);
  onProgress({ phase: "done", done: total, total });
  return final;
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILE EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value, messages } = await mammoth.extractRawText({ arrayBuffer });
  if (!value?.trim()) {
    // Try HTML extraction as fallback for complex docx
    const html = await mammoth.convertToHtml({ arrayBuffer });
    const text = html.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) throw new Error("Walang nababasang text sa Word document. Baka ito ay image-only o protektado.");
    return text;
  }
  return value;
}

async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((resolve, reject) => {
    const script  = document.createElement("script");
    script.src    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Hindi ma-load ang PDF reader. Subukan ulit."));
    document.head.appendChild(script);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function extractPdfText(file) {
  await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (e) {
    throw new Error("Hindi ma-buksan ang PDF. Baka sira o naka-encrypt ang file.");
  }

  const totalPages = pdf.numPages;
  const pages      = [];
  let   textFound  = false;

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text    = content.items.map((item) => item.str).join(" ").trim();
      pages.push(text);
      if (text.length > 20) textFound = true;
    } catch {
      pages.push(""); // Skip unreadable page, don't fail entire doc
    }
  }

  if (!textFound) {
    throw new Error(
      `Ang PDF na ito ay mukhang scanned / image-based (${totalPages} pahina). ` +
      "Hindi ma-extract ang text nang direkta. Gamitin ang OCR software (tulad ng Adobe Acrobat o Google Drive) para i-convert muna bago i-upload."
    );
  }

  const fullText = pages.join("\n\n").trim();
  return { text: fullText, pageCount: totalPages };
}

// ─────────────────────────────────────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateFile(file) {
  if (!file) return "Walang file na napili.";
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx", "doc"].includes(ext))
    return "PDF o Word (.docx / .doc) lamang ang tinatanggap.";
  if (file.size === 0)
    return "Ang file ay walang laman (0 bytes).";
  if (file.size > MAX_FILE_BYTES)
    return `Ang file ay masyadong malaki (${(file.size / 1048576).toFixed(1)} MB). Max: 20 MB.`;
  return null;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function FileTypeIcon({ ext }) {
  const isPdf = ext === "pdf";
  const color  = isPdf ? "#bf1e2e" : "#1565c0";
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12"
      />
      <path d="M13 2v6h6" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <text x="5" y="19" fontSize="4.5" fontWeight="800" fill={color} fontFamily="sans-serif">
        {isPdf ? "PDF" : "DOC"}
      </text>
    </svg>
  );
}

function RateBadge({ remaining }) {
  const pct   = remaining / DAILY_LIMIT;
  const color = pct > 0.4 ? "#f5c518" : pct > 0.15 ? "#e0882a" : "#bf1e2e";
  return (
    <div className="ms-rate">
      <span style={{ color }}>◉</span>
      <span>{remaining} / {DAILY_LIMIT} requests remaining ngayon</span>
    </div>
  );
}

function ProgressBar({ progress }) {
  if (!progress) return null;
  const { phase, done, total } = progress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const label =
    phase === "chunking"    ? "Hinahati ang dokumento..." :
    phase === "summarizing" ? `Sinusuri ang bahagi ${done} / ${total}...` :
    phase === "merging"     ? "Pinagsasama ang mga buod..." :
    "Tapos na!";

  return (
    <div className="ms-progress-wrap">
      <div className="ms-progress-label">{label} <span>{pct}%</span></div>
      <div className="ms-progress-bar">
        <div className="ms-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SummaryDisplay({ text }) {
  return (
    <div className="ms-summary-body">
      {text.split("\n").filter(l => l.trim()).map((line, i) => {
        // Heading: ## or # or **Bold standalone**
        if (/^#{1,3}\s/.test(line))
          return <h3 key={i} className="ms-sum-heading">{line.replace(/^#{1,3}\s/, "")}</h3>;

        if (/^\*\*[^*]+\*\*\s*[—:-]/.test(line) || /^\*\*[^*]+\*\*$/.test(line)) {
          const cleaned = line.replace(/\*\*/g, "");
          return <p key={i} className="ms-sum-bold">{cleaned}</p>;
        }

        // Inline bold
        if (/\*\*.*?\*\*/.test(line)) {
          const html = line.replace(
            /\*\*(.*?)\*\*/g,
            (_, m) =>
              `<strong style="color:var(--gold);font-family:'Bebas Neue',sans-serif;letter-spacing:0.05em">${m}</strong>`
          );
          return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }

        // Bullet
        if (/^[-•*]\s/.test(line))
          return (
            <div key={i} className="ms-sum-bullet">
              <span className="ms-sum-bullet-dot">◆</span>
              <span>{line.replace(/^[-•*]\s/, "")}</span>
            </div>
          );

        // Numbered list
        const numbered = line.match(/^(\d+)[.)]\s(.*)/);
        if (numbered)
          return (
            <div key={i} className="ms-sum-numbered">
              <span className="ms-sum-num-badge">{numbered[1]}</span>
              <span>{numbered[2]}</span>
            </div>
          );

        // Divider
        if (/^---+$/.test(line)) return <hr key={i} className="ms-sum-divider" />;

        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MagsuriTayo() {
  const [file,       setFile]       = useState(null);
  const [fileStats,  setFileStats]  = useState(null); // { words, pages, chunks }
  const [dragging,   setDragging]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [progress,   setProgress]   = useState(null);
  const [summary,    setSummary]    = useState("");
  const [error,      setError]      = useState("");
  const [lang,       setLang]       = useState("fil");
  const [copied,     setCopied]     = useState(false);
  const [remaining,  setRemaining]  = useState(getRemainingRequests);

  const fileRef     = useRef();
  const intervalRef = useRef(null);
  const abortRef    = useRef(false);

  // ── Loading message rotation ───────────────────────────────────────────────
  const startLoadingCycle = () => {
    let idx = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[idx]);
    }, 2200);
  };

  const stopLoadingCycle = () => clearInterval(intervalRef.current);

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setFileStats(null);
    setSummary("");
    setError("");
    setProgress(null);
  }, []);

  const clearFile = () => {
    setFile(null);
    setFileStats(null);
    setSummary("");
    setError("");
    setProgress(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, [acceptFile]);

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  // ── Summarize ──────────────────────────────────────────────────────────────

  const handleSummarize = async () => {
    if (!file) return setError("Pumili muna ng dokumento.");
    if (!GROQ_API_KEY) return setError("Hindi ma-load ang API key. Makipag-ugnayan sa admin.");
    if (!consumeRequest()) {
      return setError(`Naabot na ang limitasyon ngayon (${DAILY_LIMIT} requests/day). Bumalik bukas!`);
    }
    setRemaining(getRemainingRequests());

    setLoading(true);
    setError("");
    setSummary("");
    setProgress(null);
    abortRef.current = false;

    startLoadingCycle();

    try {
      // ── 1. Extract text ──────────────────────────────────────────────────
      const ext = file.name.split(".").pop().toLowerCase();
      let extractedText = "";
      let pageCount = null;

      if (ext === "pdf") {
        const result = await extractPdfText(file);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else {
        extractedText = await extractDocxText(file);
      }

      if (!extractedText?.trim()) {
        throw new Error(
          "Hindi ma-extract ang text mula sa dokumentong ito. " +
          "Baka ito ay image-only, naka-password-protect, o sira ang file."
        );
      }

      // ── 2. Compute stats ─────────────────────────────────────────────────
      const words  = countWords(extractedText);
      const chunks = chunkText(extractedText);

      setFileStats({
        words,
        pages:  pageCount ?? Math.ceil(words / 250), // estimate if no page count
        chunks: chunks.length,
      });

      // Guard: minimum useful content
      if (words < 30) {
        throw new Error(
          "Ang dokumento ay masyadong maikli o halos walang text. " +
          "Tiyaking hindi ito blank o image-only na file."
        );
      }

      // ── 3. Summarize ─────────────────────────────────────────────────────
      const result = await summarizeDocument(
        extractedText,
        file.name,
        lang,
        (prog) => setProgress(prog)
      );

      if (!result?.trim()) {
        throw new Error("Walang buod na natanggap mula sa modelo. Subukan ulit.");
      }

      setSummary(result);
    } catch (e) {
      refundRequest();
      setRemaining(getRemainingRequests());

      // Map common errors to Tagalog-friendly messages
      const msg = e.message || "May nangyaring error. Subukan ulit.";
      setError(msg);
    } finally {
      stopLoadingCycle();
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const fileExt   = file?.name.split(".").pop().toLowerCase() ?? "";
  const fileSize  = file ? `${(file.size / 1024).toFixed(1)} KB` : "";
  const canSubmit = !loading && !!file && remaining > 0;

  const progressLabel = (() => {
    if (!progress) return null;
    const { phase, done, total } = progress;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (phase === "chunking")    return `Hinahati ang dokumento... ${pct}%`;
    if (phase === "summarizing") return `Sinusuri ang bahagi ${done} / ${total} ... ${pct}%`;
    if (phase === "merging")     return `Pinagsasama ang mga buod... ${pct}%`;
    return `Tapos na! ${pct}%`;
  })();

  const progressPct = (() => {
    if (!progress) return 0;
    const { done, total } = progress;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="ms-root">

      <div className="ms-header">
        <h1 className="ms-title">
          E-<span className="ms-title-gold">Panisuri</span>
        </h1>
        <p className="ms-subtitle">
          I-upload ang iyong dokumento — kahit gaano kalaki.
        </p>
      </div>

      <div className="ms-card">
        <div className="ms-corner ms-corner-tl" />
        <div className="ms-corner ms-corner-br" />

        <RateBadge remaining={remaining} />

        {/* Language */}
        <div className="ms-label">Wika ng Buod</div>
        <div className="ms-lang">
          <button className={`ms-lang-btn${lang === "fil" ? " on" : ""}`} onClick={() => setLang("fil")}>
            🇵🇭 Filipino
          </button>
          <button className={`ms-lang-btn${lang === "en" ? " on" : ""}`} onClick={() => setLang("en")}>
            🇺🇸 English
          </button>
        </div>

        {/* Drop zone */}
        <div className="ms-label">Dokumento</div>
        <div
          className={`ms-drop${dragging ? " active" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
        >
          <span className="ms-drop-icon">📄</span>
          <p className="ms-drop-text">I-drag dito ang iyong file, o mag-click para pumili</p>
          <p className="ms-drop-sub">
            Tinatanggap: PDF, DOCX · Max 20 MB · Anumang laki ng dokumento
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) acceptFile(e.target.files[0]); }}
        />

        {/* File chip */}
        {file && (
          <div className="ms-file">
            <FileTypeIcon ext={fileExt} />
            <div className="ms-file-info">
              <div className="ms-file-name">{file.name}</div>
              <div className="ms-file-size">
                {fileSize}
                {fileStats && (
                  <span style={{ marginLeft: 8 }}>
                    · ~{fileStats.words.toLocaleString()} salita
                    · {fileStats.chunks > 1 ? `${fileStats.chunks} chunks` : "1 chunk"}
                  </span>
                )}
              </div>
            </div>
            <button className="ms-rm-btn" onClick={clearFile}>✕</button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="ms-error">⚠ {error}</div>}

      {/* Submit */}
      <div className="ms-btn-row">
        <button className="ms-btn" onClick={handleSummarize} disabled={!canSubmit}>
          {loading ? (
            <>
              <div className="ms-spinner" style={{ width: 20, height: 20, margin: 0 }} />
              {loadingMsg}
            </>
          ) : remaining === 0 ? (
            "✦ UBOS NA ANG LIMIT NGAYON ✦"
          ) : (
            "✦ SIMULAN ANG PAGSUSURI ✦"
          )}
        </button>
      </div>

      {/* Progress */}
      {loading && progress && (
        <div className="ms-summary" style={{ paddingTop: 16 }}>
          <div className="ms-progress-wrap">
            <div className="ms-progress-label">
              <span>{progressLabel}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="ms-progress-bar">
              <div className="ms-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner (before progress kicks in) */}
      {loading && !progress && (
        <div className="ms-summary">
          <div className="ms-loading">
            <div className="ms-spinner" />
            <p className="ms-loading-text">{loadingMsg}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {summary && !loading && (
        <div className="ms-summary">
          <div className="ms-corner ms-corner-tl" />
          <div className="ms-corner ms-corner-br" />
          <div className="ms-sum-header">
            <div className="ms-sum-title">📋 Buod ng Dokumento</div>
            <button className={`ms-copy-btn${copied ? " on" : ""}`} onClick={handleCopy}>
              {copied ? "✓ NAKOPYA" : "⎘ KOPYAHIN"}
            </button>
          </div>
          {fileStats?.chunks > 1 && (
            <div style={{ fontSize: 12, color: "#888", padding: "0 1rem 0.5rem", fontStyle: "italic" }}>
              Naproseso ng {fileStats.chunks} chunks · ~{fileStats.words.toLocaleString()} salita
            </div>
          )}
          <SummaryDisplay text={summary} />
        </div>
      )}

      <div className="ms-footer">
        <span>Powered by Groq · llama-3.3-70b-versatile</span>
        <div className="ms-footer-dot" />
        <span>E-Panisuri</span>
      </div>

    </div>
  );
}