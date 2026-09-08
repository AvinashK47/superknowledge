# 3-Minute Demo Video Script & Complete Walkthrough Guide

> **Assignment**: Superjoin Engineering Intern Task — Fact Knowledge Layer  
> **Presenter**: Avinash Kushwaha (B.Tech CSE - AI & ML)  
> **Target Duration**: Exactly 2 minutes 50 seconds (under the 3-minute hard ceiling)

---

## 🎬 Recording Setup & Tab Preparation

Have the following browser tabs ready in your browser window:
- **Tab 1**: `http://localhost:3000` (SuperKnowledge Dashboard — on the **Raw Workspace Canvas**, model set to **Flash Lite**).
- **Tab 2**: `README.md` or `ARCHITECTURE_AND_WORKFLOW.md` (scrolled to the **System Architecture & 5-Pass Pipeline** diagrams).
- **Terminal (Optional in split view)**: Showing `pnpm dev` running cleanly with worker daemon logs.

---

## ⏱️ Turn-by-Turn Video Script with Exact Timestamps

---

### [00:00 – 00:25] The Problem & The Mission
**On-Screen**: Tab 1 (`http://localhost:3000/`) — SuperKnowledge Raw Workspace canvas.

**Spoken Script**:
> "Hi everyone, I'm Avinash Kushwaha. Today I'm presenting **SuperKnowledge** — an audit-grade Fact Knowledge Layer built for the Superjoin engineering assignment.
> 
> Real-world financial and macroeconomic PDFs are notoriously noisy. Multiple official filings often make seemingly contradictory statements about the exact same company or economy. Standard vector RAG fails here because it retrieves isolated text chunks without understanding accounting perimeters, mathematical units, or temporal context.
> 
> SuperKnowledge turns unstructured PDFs into a verified, provenance-anchored fact layer."

---

### [00:25 – 00:55] Architecture & 5-Pass Pipeline Deep Dive
**On-Screen**: Switch to Tab 2 (`README.md` or `ARCHITECTURE_AND_WORKFLOW.md`), showing the **Mermaid Architecture & Pipeline diagrams**. Hover over the layers as you speak.

**Spoken Script**:
> "Let's look at our architecture and workflow:
> 
> I built this as a decoupled **Turborepo Monorepo** with four dedicated workspaces:
> 1. **`apps/web`**: A forensic Next.js 16 UI on port 3000.
> 2. **`apps/backend`**: A stateless Express 5 REST gateway on port 8000.
> 3. **`apps/worker`**: An autonomous background compute daemon watching our persistent job queue.
> 4. **`packages/shared`**: A single source of truth for TypeScript types and Zod schemas.
> 
> Our **5-Pass Processing Pipeline** operates in distinct stages:
> First, `pdftotext -layout` extracts physical page text preserving spatial columns without text interleaving.
> Second, **Gemini 3.5 Flash Lite** extracts structured claims with strict Zod schemas in 8-to-12 page high-density chunks.
> Third, our **Deterministic Non-AI Guardrail** verifies exact quotes against physical page text.
> Fourth, a **4-Pass Hierarchical Clustering** engine groups related metrics by canonical keys and metric families.
> Finally, our **Reconciliation Arbiter** evaluates mathematical and contextual relationships."

---

### [00:55 – 01:25] Live Ingestion & Flash Lite in Action
**On-Screen**: Switch back to Tab 1 (`http://localhost:3000/`). Click **"Analyze India Macro Live from Scratch"** (or Delhivery). The animated `JobProgressBanner` appears showing real-time step updates and percentage.

**Spoken Script**:
> "Notice that our application starts completely raw — there is zero pre-baked cache. When I click *'Analyze India Macro Live from Scratch'*, the Express API enqueues a background job.
> 
> Our worker processes 3 institutional reports totaling nearly 300 pages.
> I chose **Gemini 3.5 Flash Lite** as our universal default. Flash Lite slashes full extraction time to **under 40 seconds** while completely preventing free-tier 429 rate limit errors.
> 
> As you can see on the live banner, it processes each document, runs our deterministic quote guardrail, clusters 88 facts across documents, and completes in real time!"

---

### [01:25 – 02:05] The 4 Mandatory Cases & Non-AI Guardrail
**On-Screen**: Banner reaches 100%. The dashboard hydrates showing 88 facts, Case 1, Case 2, Case 3, and 97%+ Guardrail provenance.
Click **"Case 2: Contradiction"** filter tab, then click into **"India: Real GDP Growth Rate"**.

**Spoken Script**:
> "Here are our four evaluation cases:
> 
> **Case 2: Genuine Contradiction**: The Economic Survey reports India's FY25 Real GDP growth at **6.4%** based on First Advance Estimates. However, both the RBI and IMF report **6.5%** for the identical period. Our engine identifies this as an unreconciled institutional divergence and flags it explicitly rather than hallucinating consensus.
> 
> **Case 1: Multi-Document Corroboration**: When figures align across different accounting formats — such as Delhivery's ₹81,415 Million versus ₹8,142 Crores — our engine applies mathematical unit normalization ($1\text{ Cr} = 10\text{ M}$) to verify multi-document agreement.
> 
> Most importantly, every claim is vetted by our **Deterministic Non-AI Guardrail**. We do not rely on an LLM-as-judge. Instead, an algorithmic substring match checks whether the quote literally exists on the reported page. If a quote is hallucinated or scrambled by OCR, it is assigned 0.0 confidence and rejected as a **Case 4 Guardrail Failure**."

---

### [02:05 – 02:35] Case 3 Contextual Reconciliation & Audit Workbench
**On-Screen**: Click **"Case 3: Reconciled"** filter tab. Open **"India: Inflation Measures"** (or Deficit / Delhivery Headcount).
Toggle **"View Auditor Rationale"** to show the Step-by-Step Audit Rationale and Disambiguation Factors.
Click **"Open Quote in New Tab"** on Fact 1 to show the interactive HTML Provenance Viewer highlighting the quote in yellow on the PDF page.

**Spoken Script**:
> "Now let's examine **Case 3: Apparent Contradiction Reconciled by Context**.
> 
> In the RBI report, Headline CPI is cited at **4.6%**, Core Inflation at **3.5%**, Food at **6.7%**, and Fuel at **-2.5%**. To a naive system, these look like massive contradictions.
> 
> But opening our **Audit Workbench**, our engine's **Step-by-Step Audit Rationale** explains the exact resolution: Core Inflation explicitly excludes food and fuel, proving that these four figures represent the granular components of the headline rate.
> 
> We see the exact same power with Delhivery's headcount: **98,135** total workforce strength versus **63,713** team size, which our engine reconciles with mathematical proof: $63,713\text{ core} + 34,422\text{ partner agents} = 98,135$.
> 
> Clicking *'Open Quote in New Tab'* opens our deep provenance viewer, pinning the exact verbatim quote with spatial visual highlighting."

---

### [02:35 – 02:50] Vector PDF Audit Export & Closing
**On-Screen**: Close drawer. Click **"Export PDF Report"** in the top navbar. A new tab opens instantly showing the 4-page vector PDF report with executive telemetry, conflict tables, and audit rationales.

**Spoken Script**:
> "Finally, enterprise compliance requires portable, immutable proof. Clicking **'Export PDF'** generates a client-side vector PDF report complete with executive telemetry, source document verification tables, and full Step-by-Step Audit Rationales.
> 
> SuperKnowledge turns complex, contradictory PDFs into a deterministic, audit-grade Fact Knowledge Layer. Thank you!"

---

## 🎯 High-Impact Talking Points & Evaluator Q&A

| Question / Topic | Key 1-Sentence Answer to Deliver |
| :--- | :--- |
| **Why not just use ChatGPT or LangChain RAG?** | "Vector RAG retrieves semantic chunks but cannot normalize units ($1\text{ Cr} = 10\text{ M}$), cannot detect accounting perimeter differences (Standalone vs. Consolidated), and cannot guarantee verbatim grounding." |
| **Why a non-AI guardrail?** | "Using an LLM to verify an LLM is circular reasoning. An algorithmic substring match against the PDF's physical text layer provides 100% mathematical certainty against hallucination." |
| **Why Gemini 3.5 Flash Lite?** | "It delivers sub-40-second end-to-end processing across 300 pages with structured Zod outputs and completely eliminates free-tier 429 rate limit errors." |
| **Why a decoupled monorepo?** | "Heavy PDF layout extraction and clustering take 30-40 seconds. Isolating compute in a background worker daemon prevents UI thread blocking and HTTP timeouts." |
| **How do you handle multi-column PDFs?** | "`pdftotext -layout` computes spatial bounding boxes, preserving whitespace formatting so column 1 text doesn't bleed across into column 2." |
