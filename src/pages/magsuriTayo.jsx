// ─────────────────────────────────────────────────────────────────────────────
//  E-Panisuri — AI Document Summarizer (Modern Redesign)
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
//    • Back button support
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from "react";
import * as mammoth from "mammoth";
import "./magsuriTayo.css";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL     = "llama-3.3-70b-versatile";
const GROQ_API_URL   = "https://api.groq.com/openai/v1/chat/completions";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const DAILY_LIMIT    = 15;
const RATE_KEY       = "ms_rate";
const CHUNK_SIZE     = 6_000;

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

function chunkText(text, chunkSize = CHUNK_SIZE) {
  if (text.length <= chunkSize) return [text];
  const chunks  = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining.trim());
      break;
    }
    let splitAt = chunkSize;
    const paraBreak = remaining.lastIndexOf("\n\n", chunkSize);
    if (paraBreak > chunkSize * 0.5) splitAt = paraBreak;
    else {
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
      if (r.status === 401) e.message = "API key error. Makipag-ugnayan sa admin.";
      else if (r.status === 429) e.message = "Rate limited ng Groq. Sandaling hintay...";
      throw e;
    }
    return r.json();
  });
  return res.choices?.[0]?.message?.content?.trim() || "";
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROMPTS
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

async function summarizeChunk(chunk, chunkIndex, totalChunks, fileName, lang) {
  const isOnly  = totalChunks === 1;
  const partNote = isOnly
    ? ""
    : `\n\nIto ay bahagi ${chunkIndex + 1} ng ${totalChunks} ng dokumento. I-extract ang lahat ng mahahalagang impormasyon mula sa seksyong ito.`;

  const prompt = isOnly
    ? `${fullSummaryStructure(fileName)}\n\n---DOKUMENTO---\n${chunk}`
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

  const partials = [];
  for (let i = 0; i < total; i++) {
    onProgress({ phase: "summarizing", done: i, total });
    const partial = await summarizeChunk(chunks[i], i, total, fileName, lang);
    partials.push(partial);
    onProgress({ phase: "summarizing", done: i + 1, total });
  }

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
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  if (!value?.trim()) {
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
  } catch {
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
      pages.push("");
    }
  }
  if (!textFound) {
    throw new Error(
      `Ang PDF na ito ay mukhang scanned / image-based (${totalPages} pahina). ` +
      "Hindi ma-extract ang text nang direkta. Gamitin ang OCR software bago i-upload."
    );
  }
  return { text: pages.join("\n\n").trim(), pageCount: totalPages };
}

// ─────────────────────────────────────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateFile(file) {
  if (!file) return "Walang file na napili.";
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx", "doc"].includes(ext))
    return "PDF o Word (.docx / .doc) lamang ang tinatanggap.";
  if (file.size === 0) return "Ang file ay walang laman (0 bytes).";
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

function BackButton({ onClick }) {
  return (
    <button className="ms-back-btn" onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Bumalik
    </button>
  );
}

function RateBadge({ remaining }) {
  const pct   = remaining / DAILY_LIMIT;
  const color = pct > 0.4 ? "#F5C518" : pct > 0.15 ? "#E0882A" : "#E8192C";
  return (
    <div className="ms-rate">
      <span className="ms-rate-dot" style={{ background: color }} />
      <span style={{ color: "var(--text2)" }}>{remaining} / {DAILY_LIMIT} requests natitira ngayon</span>
    </div>
  );
}

function FileIcon({ ext }) {
  const isPdf = ext === "pdf";
  return (
    <div className={`ms-file-icon ${isPdf ? "ms-file-icon-pdf" : "ms-file-icon-doc"}`}>
      {isPdf ? "PDF" : "DOC"}
    </div>
  );
}

function SummaryDisplay({ text }) {
  return (
    <div className="ms-summary-body">
      {text.split("\n").filter(l => l.trim()).map((line, i) => {
        if (/^#{1,3}\s/.test(line))
          return <h3 key={i} className="ms-sum-heading">{line.replace(/^#{1,3}\s/, "")}</h3>;

        if (/^\*\*[^*]+\*\*\s*[—:-]/.test(line) || /^\*\*[^*]+\*\*$/.test(line))
          return <p key={i} className="ms-sum-bold">{line.replace(/\*\*/g, "")}</p>;

        if (/\*\*.*?\*\*/.test(line)) {
          const html = line.replace(
            /\*\*(.*?)\*\*/g,
            (_, m) => `<strong style="color:var(--gold);font-family:'Space Grotesk',sans-serif;font-weight:600">${m}</strong>`
          );
          return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }

        if (/^[-•*]\s/.test(line))
          return (
            <div key={i} className="ms-sum-bullet">
              <span className="ms-sum-bullet-dot" />
              <span>{line.replace(/^[-•*]\s/, "")}</span>
            </div>
          );

        const numbered = line.match(/^(\d+)[.)]\s(.*)/);
        if (numbered)
          return (
            <div key={i} className="ms-sum-numbered">
              <span className="ms-sum-num-badge">{numbered[1]}</span>
              <span>{numbered[2]}</span>
            </div>
          );

        if (/^---+$/.test(line)) return <hr key={i} className="ms-sum-divider" />;

        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MagsuriTayo({ onBack }) {
  const [file,       setFile]       = useState(null);
  const [fileStats,  setFileStats]  = useState(null);
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

  const onDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }, [acceptFile]);
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
    startLoadingCycle();

    try {
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
        throw new Error("Hindi ma-extract ang text mula sa dokumentong ito. Baka image-only, naka-password, o sira ang file.");
      }

      const words  = countWords(extractedText);
      const chunks = chunkText(extractedText);
      setFileStats({ words, pages: pageCount ?? Math.ceil(words / 250), chunks: chunks.length });

      if (words < 30) {
        throw new Error("Ang dokumento ay masyadong maikli o halos walang text. Tiyaking hindi ito blank o image-only na file.");
      }

      const result = await summarizeDocument(extractedText, file.name, lang, (prog) => setProgress(prog));

      if (!result?.trim()) throw new Error("Walang buod na natanggap mula sa modelo. Subukan ulit.");
      setSummary(result);
    } catch (e) {
      refundRequest();
      setRemaining(getRemainingRequests());
      setError(e.message || "May nangyaring error. Subukan ulit.");
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
  const fileExt  = file?.name.split(".").pop().toLowerCase() ?? "";
  const fileSize = file ? `${(file.size / 1024).toFixed(1)} KB` : "";
  const canSubmit = !loading && !!file && remaining > 0;

  const progressLabel = (() => {
    if (!progress) return null;
    const { phase, done, total } = progress;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (phase === "chunking")    return `Hinahati ang dokumento... ${pct}%`;
    if (phase === "summarizing") return `Sinusuri ang bahagi ${done} / ${total}`;
    if (phase === "merging")     return `Pinagsasama ang mga buod...`;
    return `Tapos na!`;
  })();

  const progressPct = (() => {
    if (!progress) return 0;
    const { done, total } = progress;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ms-root">

      {/* Back Button */}
      <BackButton onClick={onBack ?? (() => window.history.back())} />

      {/* Header */}
      <div className="ms-header">
        <div className="ms-eyebrow">AI Document Summarizer</div>
        <h1 className="ms-title">
          P<span className="ms-title-gold">ANURI</span>
        </h1>
        <p className="ms-subtitle">
          I-upload ang iyong dokumento
        </p>
      </div>

      {/* Main Card */}
      <div className="ms-card">
        <RateBadge remaining={remaining} />

        {/* Language */}
        <div className="ms-label">Wika ng Buod</div>
        <div className="ms-lang">
          <button className={`ms-lang-btn${lang === "fil" ? " on" : ""}`} onClick={() => setLang("fil")}>
            🇵🇭 Filipino
          </button>
        </div>

        {/* Drop Zone */}
        <div className="ms-label">Dokumento</div>
        <div
          className={`ms-drop${dragging ? " active" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
        >
          <div className="ms-drop-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text2)" }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <p className="ms-drop-text">I-drag dito ang iyong file, o mag-click para pumili</p>
          <p className="ms-drop-sub">PDF, DOCX · Max 20 MB </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) acceptFile(e.target.files[0]); }}
        />

        {/* File Chip */}
        {file && (
          <div className="ms-file">
            <FileIcon ext={fileExt} />
            <div className="ms-file-info">
              <div className="ms-file-name">{file.name}</div>
              <div className="ms-file-meta">
                {fileSize}
                {fileStats && (
                  <span>
                    {" "}· ~{fileStats.words.toLocaleString()} salita
                    {fileStats.chunks > 1 ? ` · ${fileStats.chunks} chunks` : ""}
                  </span>
                )}
              </div>
            </div>
            <button className="ms-rm-btn" onClick={clearFile} title="Alisin ang file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="ms-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="ms-btn-row">
        <button className="ms-btn" onClick={handleSummarize} disabled={!canSubmit}>
          {loading ? (
            <>
              <div className="ms-spinner" style={{ width: 18, height: 18, margin: 0 }} />
              {loadingMsg}
            </>
          ) : remaining === 0 ? (
            "Ubos na ang limit ngayon"
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Simulan ang Pagsusuri
            </>
          )}
        </button>
      </div>

      {/* Progress */}
      {loading && progress && (
        <div className="ms-summary" style={{ paddingTop: "1.5rem" }}>
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

      {/* Loading spinner before progress */}
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
          <div className="ms-sum-header">
            <div className="ms-sum-title">
              <span className="ms-sum-pill">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Buod
              </span>
              {file?.name}
            </div>
            <button className={`ms-copy-btn${copied ? " on" : ""}`} onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Nakopya
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Kopyahin
                </>
              )}
            </button>
          </div>
          {fileStats?.chunks > 1 && (
            <div className="ms-chunk-info">
              Naproseso ng {fileStats.chunks} chunks · ~{fileStats.words.toLocaleString()} salita
            </div>
          )}
          <SummaryDisplay text={summary} />
        </div>
      )}

      {/* Footer */}
      <div className="ms-footer">
        <span>Powered by Groq</span>
        <span className="ms-footer-sep" />
        <span>llama-3.3-70b-versatile</span>
        <span className="ms-footer-sep" />
        <span>PANURI</span>
      </div>

    </div>
  );
}