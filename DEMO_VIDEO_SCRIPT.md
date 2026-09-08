# 2.5 to 3 Minute Demo Video Script & Walkthrough Guide

> **Assignment**: Superjoin Engineering Intern Task — Fact Knowledge Layer  
> **Presenter**: Avinash Kushwaha (B.Tech CSE - AI & ML)  
> **Target Duration**: 2 minutes 45 seconds (±15 seconds)

---

## Pre-Recording Checklist
1. Terminal running `pnpm dev` in the background.
2. Browser open at `http://localhost:3000` on the **Raw Workspace Canvas** (`Zero Preloaded Data`).
3. Model selector set to **Flash Lite**.
4. Zoom level set to 100% or 110% for crisp readability.
5. Microphone tested and audio clear.

---

## ⏱️ Video Breakdown & Turn-by-Turn Script

---

### [00:00 – 00:30] The Problem & System Architecture
**On-Screen**: Start at `http://localhost:3000/` showing the clean Raw Workspace canvas with the title *"Fact Verification & Cross-Document Reconciliation"*.

**Spoken Script**:
> "Hi everyone, I'm Avinash Kushwaha. Today I'm presenting **SuperKnowledge** — an audit-grade Fact Knowledge Layer built for the Superjoin engineering assignment.
> 
> Enterprise financial filings and government reports are notoriously messy. Different reports often make seemingly contradictory statements about the exact same company or economy. Standard vector RAG fails here because it retrieves isolated text chunks without understanding accounting perimeters, units, or temporal context.
> 
> To solve this, I designed a decoupled **Turborepo Monorepo**: a Next.js 16 audit dashboard on port 3000, a stateless Express 5 API gateway on port 8000, a dedicated background compute daemon watching a persistent queue, and a shared TypeScript package guaranteeing type safety across all layers."

---

### [00:30 – 01:10] Live Ingestion & Flash Lite Acceleration
**On-Screen**: Click **"Analyze India Macro Live from Scratch"** (or drag & drop PDFs into the upload modal). The animated `JobProgressBanner` appears showing real-time step updates and percentage.

**Spoken Script**:
> "Notice that our application starts completely raw — there is zero pre-baked cache. When I click *'Analyze India Macro Live from Scratch'*, the Express API enqueues an asynchronous job.
> 
> Our autonomous background worker picks up the 3 institutional reports totaling nearly 300 pages. It uses `pdftotext -layout` to preserve spatial multi-column boundaries, then extracts atomic claims using **Gemini 3.5 Flash Lite** in high-density 8-to-12 page chunks.
> 
> I chose Flash Lite as our default model because it slashes extraction latency to under 40 seconds while completely avoiding free-tier 429 quota exhaustion. And watch this: the worker extracts over 80 discrete claims and completes multi-pass reconciliation in real time!"

---

### [01:10 – 01:50] The 4 Cases & Deterministic Non-AI Guardrail
**On-Screen**: The worker finishes (100%), and the dashboard hydrates with the telemetry overview:
- Total Grounded Facts: ~88
- Case 1: Corroborated
- Case 2: Contradictions (e.g. 2–3)
- Case 3: Reconciled (e.g. 2–3)
- Guardrail Provenance: ~97%+

Filter by clicking **"Case 2: Contradiction"**, then click into **"India: Real GDP Growth Rate"**.

**Spoken Script**:
> "Here are our four evaluation cases:
> 
> **Case 2: Genuine Contradiction**: The Economic Survey reports India's FY25 Real GDP growth at **6.4%** based on First Advance Estimates. However, both the RBI and IMF report **6.5%** for the identical fiscal period. Our system detects this as an irreconcilable institutional divergence and flags it explicitly rather than hallucinating an automated reconciliation.
> 
> **Case 1: Multi-Document Corroboration**: Across documents, when figures like GDP or revenue align across different reporting conventions — such as Delhivery's ₹81,415 Million versus ₹8,142 Crores — our engine applies mathematical unit normalization ($1\text{ Cr} = 10\text{ M}$) to prove multi-document consensus.
> 
> Most critically, every fact passes through our **Deterministic Non-AI Guardrail**. We do not use an LLM-as-judge. Instead, we perform an algorithmic substring match against the physical PDF page text. If a quote or page doesn't literally match, it is immediately rejected as a **Case 4 Guardrail Failure** with 0.0 confidence."

---

### [01:50 – 02:25] Case 3 Reconciled by Context & Forensic Audit Workbench
**On-Screen**: Click **"Case 3: Reconciled"** filter tab. Click **"India: Inflation Measures"** or **"India: Government Deficit Measures"** to open the centered Forensic Audit Workbench.
Toggle **"View Auditor Rationale"** to reveal the detailed Step-by-Step Rationale and Structured Disambiguation Factors.
Click **"Open Quote in New Tab"** on Fact 1 to show the interactive HTML Provenance Viewer highlighting the exact verbatim quote in yellow on the PDF page.

**Spoken Script**:
> "Now let's look at **Case 3: Apparent Contradiction Reconciled by Context**.
> 
> Look at Inflation: the RBI report cites Headline CPI at **4.6%**, Core Inflation at **3.5%**, Food at **6.7%**, and Fuel at **-2.5%**. To a naive model, these numbers look like wild contradictions. 
> 
> But when we open our **Audit Workbench**, you can see our engine's **Step-by-Step Audit Rationale**: it automatically recognized that Core Inflation explicitly excludes food and fuel, proving that these four figures represent the granular components of the headline rate. 
> 
> We see the exact same power with Delhivery's headcount: **98,135** total workforce strength versus **63,713** team size, which reconciles with mathematical proof: $63,713\text{ core team} + 34,422\text{ partner agents} = 98,135$.
> 
> Clicking *'Open Quote in New Tab'* opens our deep provenance viewer, instantly pinning the exact verbatim quote and page bounds in physical context."

---

### [02:25 – 02:45] Vector PDF Audit Export & Closing
**On-Screen**: Close drawer. Click **"Export PDF Report"** in the top navbar. A new browser tab opens immediately displaying the 4-page vector PDF report with executive telemetry, source document verification, conflict tables, and audit rationales.

**Spoken Script**:
> "Finally, enterprise auditors need portable, immutable proof. Clicking **'Export PDF'** generates a client-side, vector PDF audit report. It renders executive telemetry, source document verification tables, side-by-side evidence with verbatim quotes, and our complete Step-by-Step Audit Rationale.
> 
> SuperKnowledge transforms messy unstructured PDFs into an audit-grade, mathematically verified fact layer. Thank you for your time!"

---

## 🎯 High-Impact Talking Points for Evaluators

| Question / Topic | Key 1-Sentence Answer to Deliver |
| :--- | :--- |
| **Why not just use ChatGPT or LangChain RAG?** | "Vector RAG retrieves semantic chunks but cannot normalize units ($1\text{ Cr} = 10\text{ M}$), cannot detect accounting perimeter differences (Standalone vs. Consolidated), and cannot guarantee verbatim grounding." |
| **Why a non-AI guardrail?** | "Using an LLM to verify an LLM is circular reasoning. An algorithmic substring match against the PDF's physical text layer provides 100% mathematical certainty against hallucination." |
| **Why Gemini 3.5 Flash Lite?** | "It delivers sub-40-second end-to-end processing across 300 pages with structured Zod outputs and completely eliminates free-tier 429 rate limit errors." |
| **How do you handle multi-column PDFs?** | "`pdftotext -layout` preserves whitespace and column order, preventing the classic issue where text from column 1 bleeds across into column 2." |
