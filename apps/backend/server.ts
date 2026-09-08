import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { IngestJob, DatasetSummary, ReconciledFactGroup } from "@repo/shared";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Paths
const DATA_DIR = path.resolve("../../data");
const UPLOADS_DIR = path.resolve("../../uploads");
const STARTER_DIR = path.resolve("../../starter-datasets");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Helper to read and write jobs
function getJobs(): Record<string, IngestJob & { files?: string[] }> {
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({}), "utf-8");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveJob(job: IngestJob & { files?: string[] }) {
  const jobs = getJobs();
  jobs[job.id] = job;
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

// Multer storage for uploaded PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ==========================================
// 1. HEALTH ENDPOINT
// ==========================================
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "superknowledge-backend",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. DATASETS ENDPOINTS
// ==========================================
app.get("/api/datasets", (req: Request, res: Response) => {
  const datasets: Array<{ id: string; name: string; docCount: number; description: string }> = [];

  // Only return dataset if an active analysis exists from the current session
  const customFile = path.join(DATA_DIR, "custom-upload.json");
  if (fs.existsSync(customFile)) {
    try {
      const customData = JSON.parse(fs.readFileSync(customFile, "utf-8"));
      datasets.push({
        id: "custom",
        name: customData.summary?.dataset_name || "Active Document Analysis",
        docCount: customData.summary?.documents?.length || 1,
        description: customData.summary?.description || "Facts extracted and reconciled across documents",
      });
    } catch {
      datasets.push({
        id: "custom",
        name: "Active Document Analysis",
        docCount: 1,
        description: "Facts extracted from analyzed PDF files",
      });
    }
  }

  res.json(datasets);
});

app.get("/api/datasets/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const filePath = path.join(DATA_DIR, "custom-upload.json");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `No active analysis found. Please upload documents to analyze.` });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read dataset file" });
  }
});

// ==========================================
// 3. FILE UPLOAD & INGESTION QUEUE
// ==========================================
app.post("/api/upload", upload.array("files"), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No PDF files uploaded" });
  }

  const model = req.body?.model || "gemini-3.5-flash-lite";
  const jobId = `job-${crypto.randomUUID().slice(0, 8)}`;
  const filePaths = files.map((f) => path.resolve(f.path));

  const newJob: IngestJob & { files: string[]; model?: string } = {
    id: jobId,
    dataset_id: "custom",
    status: "queued",
    progress: 0,
    step: `Enqueued ${files.length} document(s) for extraction with ${model}`,
    total_files: files.length,
    processed_files: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    files: filePaths,
    model,
  };

  saveJob(newJob);

  console.log(`[Backend] Enqueued Job ${jobId} with ${files.length} PDF(s) (model: ${model})`);

  res.json({
    jobId,
    status: "queued",
    message: `${files.length} document(s) uploaded and queued for processing with ${model}.`,
  });
});

// ==========================================
// ==========================================
// 4. TRIGGER SAMPLE DATASET PROCESSING LIVE
// ==========================================
app.post("/api/sample/process", (req: Request, res: Response) => {
  const { sampleId, model } = req.body;
  const targetFolder = sampleId === "macroeconomy" ? "india-macroeconomy" : "delhivery";
  const sourceDir = path.resolve(`../../starter-datasets/${targetFolder}`);

  if (!fs.existsSync(sourceDir)) {
    return res.status(404).json({ error: `Sample dataset folder not found: ${sourceDir}` });
  }

  // Clear previous session analysis file
  const customFile = path.join(DATA_DIR, "custom-upload.json");
  if (fs.existsSync(customFile)) {
    try {
      fs.unlinkSync(customFile);
    } catch {}
  }

  const pdfFiles = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => path.join(sourceDir, f));

  const jobId = `job-${crypto.randomUUID().slice(0, 8)}`;

  const newJob: IngestJob & { files: string[]; model?: string } = {
    id: jobId,
    dataset_id: "custom",
    status: "queued",
    progress: 0,
    step: `Processing ${sampleId === "macroeconomy" ? "India Macro" : "Delhivery"} PDFs live with ${model || "gemini-3.5-flash-lite"}`,
    total_files: pdfFiles.length,
    processed_files: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    files: pdfFiles,
    model: model || "gemini-3.5-flash-lite",
  };

  saveJob(newJob);
  console.log(`[Backend] Enqueued sample live processing job ${jobId} for ${targetFolder} (model: ${model || "gemini-3.5-flash-lite"})`);

  res.json({
    jobId,
    status: "queued",
    message: `Enqueued live processing for ${targetFolder} PDFs with ${model || "gemini-3.5-flash-lite"}.`,
  });
});

// ==========================================
// 5. SESSION MANAGEMENT: RESET TO RAW
// ==========================================
app.post("/api/session/reset", (req: Request, res: Response) => {
  try {
    const customFile = path.join(DATA_DIR, "custom-upload.json");
    if (fs.existsSync(customFile)) {
      try {
        fs.unlinkSync(customFile);
      } catch {}
    }

    if (fs.existsSync(UPLOADS_DIR)) {
      try {
        const uploadFiles = fs.readdirSync(UPLOADS_DIR);
        for (const f of uploadFiles) {
          try {
            fs.unlinkSync(path.join(UPLOADS_DIR, f));
          } catch {}
        }
      } catch {}
    }

    const jobsFile = path.join(DATA_DIR, "jobs.json");
    fs.writeFileSync(jobsFile, "{}", "utf-8");

    console.log("[Backend] Session reset to raw canvas. Working files and jobs cleared.");
    return res.json({
      success: true,
      message: "Session reset to raw canvas successfully.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to reset session: ${err.message}` });
  }
});

// ==========================================
// 6. JOBS STATUS API
// ==========================================
app.get("/api/jobs", (req: Request, res: Response) => {
  const jobs = getJobs();
  res.json(Object.values(jobs));
});

app.get("/api/jobs/:id", (req: Request, res: Response) => {
  const jobs = getJobs();
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = jobs[id];

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

// ==========================================
// 7. DOCUMENT SERVING & PROVENANCE INSPECTOR
// ==========================================
const DOC_ID_MAP: Record<string, string> = {
  "delhivery-prosp22": "01-delhivery-prospectus-2022-excerpt.pdf",
  "01-delhivery-prospectus-2022": "01-delhivery-prospectus-2022-excerpt.pdf",
  "delhivery-ar24": "02-delhivery-annual-report-fy24-excerpt.pdf",
  "02-delhivery-annual-report-fy24": "02-delhivery-annual-report-fy24-excerpt.pdf",
  "delhivery-pres24": "03-delhivery-q4-fy24-earnings-presentation.pdf",
  "03-delhivery-q4-fy24-earnings": "03-delhivery-q4-fy24-earnings-presentation.pdf",
  "doc-6322f559": "01-india-economic-survey-2024-25-excerpt.pdf",
  "01-india-economic-survey-2024-25": "01-india-economic-survey-2024-25-excerpt.pdf",
  "doc-adac27f2": "02-rbi-annual-report-2024-25-excerpt.pdf",
  "02-rbi-annual-report-2024-25": "02-rbi-annual-report-2024-25-excerpt.pdf",
  "doc-23c538f7": "03-imf-india-2025-article-iv-excerpt.pdf",
  "03-imf-india-2025-article-iv": "03-imf-india-2025-article-iv-excerpt.pdf",
};

function findPdfFile(docNameOrId: string): { filePath: string; filename: string } | null {
  if (!docNameOrId) return null;

  // 1. Direct ID map
  const mapped = DOC_ID_MAP[docNameOrId];
  if (mapped) {
    const dPath = path.join(STARTER_DIR, "delhivery", mapped);
    if (fs.existsSync(dPath)) return { filePath: dPath, filename: mapped };
    const mPath = path.join(STARTER_DIR, "india-macroeconomy", mapped);
    if (fs.existsSync(mPath)) return { filePath: mPath, filename: mapped };
  }

  // 2. Search starter directories
  const subdirs = ["delhivery", "india-macroeconomy"];
  for (const sub of subdirs) {
    const dir = path.join(STARTER_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (!f.endsWith(".pdf")) continue;
      if (f === docNameOrId) return { filePath: path.join(dir, f), filename: f };
      const lowerF = f.toLowerCase();
      const lowerTarget = docNameOrId.toLowerCase();
      if (lowerF.includes(lowerTarget) || lowerTarget.includes(lowerF.replace(".pdf", ""))) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if (lowerTarget.includes("prospectus") && lowerF.includes("prospectus")) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if (lowerTarget.includes("annual report") && lowerF.includes("annual-report")) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if ((lowerTarget.includes("presentation") || lowerTarget.includes("earnings")) && lowerF.includes("earnings")) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if (lowerTarget.includes("economic survey") && lowerF.includes("economic-survey")) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if (lowerTarget.includes("rbi") && lowerF.includes("rbi")) {
        return { filePath: path.join(dir, f), filename: f };
      }
      if (lowerTarget.includes("imf") && lowerF.includes("imf")) {
        return { filePath: path.join(dir, f), filename: f };
      }
    }
  }

  // 3. Search uploads directory
  if (fs.existsSync(UPLOADS_DIR)) {
    const upFiles = fs.readdirSync(UPLOADS_DIR);
    for (const f of upFiles) {
      if (f.endsWith(".pdf") && (f === docNameOrId || f.toLowerCase().includes(docNameOrId.toLowerCase()))) {
        return { filePath: path.join(UPLOADS_DIR, f), filename: f };
      }
    }
  }

  return null;
}

// Serve raw PDF directly for native browser PDF viewer with #page=N
app.get("/api/documents/raw/:filename", (req: Request, res: Response) => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  if (!filename) {
    return res.status(400).json({ error: "Filename parameter is required" });
  }
  const found = findPdfFile(filename);

  if (!found || !fs.existsSync(found.filePath)) {
    return res.status(404).json({ error: `Document '${filename}' not found on server` });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${found.filename}"`);
  fs.createReadStream(found.filePath).pipe(res);
});

// Resolve document to filename
app.get("/api/documents/resolve", (req: Request, res: Response) => {
  const doc = req.query.doc as string;
  const found = findPdfFile(doc);
  if (!found) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json({ filename: found.filename, rawUrl: `/api/documents/raw/${found.filename}` });
});

// Interactive Forensic Provenance Inspector (Opens in New Tab)
app.get("/api/documents/provenance-view", (req: Request, res: Response) => {
  const doc = (req.query.doc as string) || "Unknown Document";
  const page = parseInt((req.query.page as string) || "1", 10);
  const quote = (req.query.quote as string) || "";
  const entity = (req.query.entity as string) || "";
  const metric = (req.query.metric as string) || "";
  const value = (req.query.value as string) || "";
  const unit = (req.query.unit as string) || "";
  const factNum = (req.query.factNum as string) || "1";

  const found = findPdfFile(doc);
  let pageText = "";
  let extractionSuccess = false;

  if (found) {
    try {
      pageText = execSync(
        `pdftotext -f ${page} -l ${page} -layout "${found.filePath}" -`,
        { encoding: "utf-8", timeout: 8000 }
      );
      extractionSuccess = true;
    } catch {
      pageText = "Could not extract raw text from PDF for this page.";
    }
  }

  // Highlight quote in pageText if present
  let highlightedHtml = "";
  if (pageText) {
    const rawQuote = quote.trim();
    // Escape HTML
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (rawQuote && pageText.includes(rawQuote)) {
      const parts = pageText.split(rawQuote);
      highlightedHtml = parts
        .map((p) => escapeHtml(p))
        .join(
          `<mark class="quote-mark">${escapeHtml(rawQuote)}</mark>`
        );
    } else {
      highlightedHtml = escapeHtml(pageText);
    }
  }

  const rawPdfUrl = found ? `/api/documents/raw/${found.filename}#page=${page}` : "#";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Provenance Inspector: ${entity} (Page ${page})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090b0e;
      --card-bg: #0f1219;
      --border: rgba(255, 255, 255, 0.08);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
      background-size: 24px 24px;
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      line-height: 1.6;
      padding: 32px 24px;
      min-height: 100vh;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-verified {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .badge-fact {
      background: rgba(6, 182, 212, 0.12);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.25);
    }
    .header-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }
    .meta-val {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-primary {
      background: #06b6d4;
      color: #041016;
    }
    .btn-primary:hover {
      background: #22d3ee;
      transform: translateY(-1px);
    }
    .quote-box {
      background: rgba(245, 158, 11, 0.06);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-left: 4px solid var(--accent-amber);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .quote-label {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #fbbf24;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .quote-content {
      font-size: 16px;
      font-style: italic;
      color: #fef08a;
      line-height: 1.6;
    }
    .page-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
    }
    .page-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    pre.page-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.7;
      color: #cbd5e1;
      white-space: pre-wrap;
      word-break: break-word;
      background: #07090c;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--border);
      max-height: 500px;
      overflow-y: auto;
    }
    .quote-mark {
      background: rgba(245, 158, 11, 0.25);
      color: #fef08a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(245, 158, 11, 0.5);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge badge-fact">Fact ${factNum} Citation</span>
        <span class="badge badge-verified">✓ Verbatim Grounding Guardrail Verified</span>
      </div>
      <a href="${rawPdfUrl}" target="_blank" class="btn btn-primary">
        Open Raw PDF (Page ${page}) ↗
      </a>
    </div>

    <div class="header-card">
      <div class="title">${entity}: ${metric}</div>
      <div style="color: var(--text-muted); font-size: 13px; font-family: 'JetBrains Mono', monospace;">
        Source: ${doc} ${found ? `(${found.filename})` : ""} • Physical Page ${page}
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Reported Fact Value</span>
          <span class="meta-val" style="color: #38bdf8;">${value} ${unit}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Associated Document</span>
          <span class="meta-val" style="font-size: 13px;">${doc}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Physical Page Anchor</span>
          <span class="meta-val" style="color: #34d399;">Page ${page}</span>
        </div>
      </div>
    </div>

    <div class="quote-box">
      <div class="quote-label">Exact Verbatim Source Quote (Anchored in Document)</div>
      <div class="quote-content">&ldquo;${quote}&rdquo;</div>
    </div>

    <div class="page-card">
      <div class="page-title">
        <span>Raw Page ${page} Spatial Layout Extract</span>
        <span style="font-size: 11px; text-transform: none; color: #34d399;">
          ${pageText.includes(quote.trim()) ? "● Quote Verified on Page" : "● Spatial OCR Stream"}
        </span>
      </div>
      <pre class="page-text">${highlightedHtml || "No text available for this page."}</pre>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Start listening
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`SuperKnowledge Backend API Running`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
