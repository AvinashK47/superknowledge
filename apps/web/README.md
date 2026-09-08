# SuperKnowledge Frontend (`apps/web`)

> **Executive Audit Dashboard & Provenance Explorer**  
> Built with Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Lucide Icons, and **Axios**.

This package contains the user interface layer of **SuperKnowledge**, an audit-grade Fact Knowledge Layer. It provides real-time visibility into cross-document fact reconciliation, source provenance citations, background worker job progress, and custom PDF ingestion.

---

## 🎯 Purpose & Role in Architecture

In our decoupled Turborepo monorepo, `apps/web` serves strictly as the **presentation and interaction layer**:
- **Zero Heavy Compute**: All heavy lifting (PDF layout extraction, Gemini LLM calls, grounding guardrail verification, and mathematical reconciliation) is delegated to `apps/worker` via `apps/backend`.
- **Axios HTTP Client**: All communication with the Express backend (`http://localhost:8000`) is managed via an Axios client instance defined in `lib/api-client.ts`.
- **Live Background Progress**: Renders the animated `JobProgressBanner` that polls `GET /api/jobs/:id` via Axios to give users real-time feedback as the background daemon processes PDF files.
- **Side-by-Side Evidence Drawer**: Allows auditors and evaluators to inspect exact verbatim quotes, physical page numbers, and step-by-step reasoning for every fact relationship.

---

## 🏗️ Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx               # Root application shell & metadata
│   ├── page.tsx                 # Main dashboard view (telemetry, matrix, modals)
│   ├── globals.css              # Dark theme styling, glassmorphism tokens
│   └── api/                     # Local fallback API routes
├── components/
│   ├── Navbar.tsx               # Header, live backend health badge, dataset tabs, re-run trigger
│   ├── StatsOverview.tsx        # KPI telemetry strip (total facts, corroborations, contradictions)
│   ├── FactMatrixTable.tsx      # Reconciled fact clusters, search bar, case category filters
│   ├── EvidenceDrawer.tsx       # Slide-over drawer with side-by-side citations and AI auditor reasoning
│   ├── UploadModal.tsx          # Drag-and-drop PDF upload modal using Axios multipart uploads
│   ├── JobProgressBanner.tsx    # Real-time worker pipeline progress bar and status tracker
│   └── Badge.tsx                # Visual badges for relationships, cases, and grounding verification
├── lib/
│   ├── api-client.ts            # Axios HTTP client connecting frontend to Express backend (:8000)
│   ├── types.ts                 # Re-exports universal data models from @repo/shared
│   ├── pdf-parser.ts            # Layout-aware PDF extraction utility
│   └── fact-engine.ts           # Grounding verification and reconciliation engine
└── test/
    └── fact-layer.test.ts       # 6 automated validation test suites
```

---

## 📡 Axios Client Integration (`lib/api-client.ts`)

Instead of native fetch, all API calls are standardized through an Axios instance with automatic timeouts, error parsing, and fallback resilience:

```typescript
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: { Accept: "application/json" },
});
```

### Key Axios Functions:
- `checkBackendHealth()`: Pings `GET /api/health` every 5 seconds to display the live green pulsing `:8000` status badge in the navbar.
- `getDatasets()`: Fetches list of available datasets from `GET /api/datasets`.
- `getDatasetDetail(id)`: Fetches full reconciled fact matrix and metadata from `GET /api/datasets/:id`.
- `uploadPDFs(files)`: Posts multipart form data to `POST /api/upload` to enqueue files for worker processing.
- `triggerStarterProcessing(datasetId)`: Posts to `POST /api/starter/process` to trigger live re-parsing of raw PDFs.
- `getJobStatus(jobId)`: Polls `GET /api/jobs/:id` to retrieve worker status (`progress`, `step`, `status`).

---

## 🚀 Running the Web App

From the monorepo root:
```bash
# Run web app individually
pnpm --filter web dev

# Or run entire monorepo concurrently (backend + worker + web)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests & Type Checks

```bash
# Run unit tests
pnpm --filter web test

# Run TypeScript check
pnpm --filter web exec tsc --noEmit
```
