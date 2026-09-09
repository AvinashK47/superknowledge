# SuperKnowledge — 2-to-3 Minute Demo Video Script

> **Presenter**: Avinash Kushwaha  
> **Target Length**: ~2 minutes 15 seconds (comfortable, natural pace under 3 minutes)  
> **Live Site**: `https://superknowledge.avinashk47.me` (or `http://localhost:3000`)

---

## ⚡ Quick Teleprompter / Cheat Sheet (At a Glance)

1. **[00:00 - 00:25] Intro & Problem**: Introduce yourself & SuperKnowledge. Explain why naive RAG fails on financial PDFs (units, scopes, conflicting numbers).
2. **[00:25 - 00:55] Architecture & Live Ingestion**: Monorepo + background worker + Gemini Flash Lite. Trigger live analysis from scratch (no frozen UI).
3. **[00:55 - 01:45] The 3 Core Reconciliation Cases**:
   - **Case 1 (Corroborated)**: Multi-doc agreement with automatic unit conversion.
   - **Case 2 (Contradiction)**: Genuine institutional conflicts flagged honestly.
   - **Case 3 (Reconciled by Context)**: Scopes disambiguated (e.g. rounded vs. exact figures).
4. **[01:45 - 02:15] Audit Trail & Verbatim Guardrail**: Open drawer, show exact page quotes & step-by-step auditor rationale. Non-AI substring check prevents hallucinations.
5. **[02:15 - 02:30] PDF Export & Conclusion**: 1-click compliance export, live VM deployment, wrap up.

---

## 🎬 Full Spoken Script (Word-for-Word)

---

### Part 1: Problem & Mission (00:00 – 00:25)
**On Screen**: Dashboard at `https://superknowledge.avinashk47.me` (or `localhost:3000`).

**What to Say**:
> "Hi everyone, I'm Avinash Kushwaha. Today I'm presenting **SuperKnowledge** — an audit-grade Fact Knowledge Layer built for Superjoin.
> 
> When analyzing corporate filings and macroeconomic reports, standard vector RAG fails. Different documents often cite conflicting numbers for the exact same metric because of differing reporting periods, accounting units, or entity scopes.
> 
> SuperKnowledge ingests messy, multi-page PDFs and turns them into a verified, cross-reconciled fact layer."

---

### Part 2: Architecture & Live Processing (00:25 – 00:55)
**On Screen**: Show the raw workspace or trigger live analysis (e.g., Delhivery or India Macro dataset). Show the live progress banner updating.

**What to Say**:
> "I built this as a **Turborepo monorepo** with Next.js on the frontend, an Express API gateway, and a dedicated background worker daemon. 
> 
> When an analysis runs, compute is offloaded entirely to the worker so the UI stays completely responsive.
> 
> We use **Gemini 3.5 Flash Lite** for high-speed, structured extraction, processing over 100 pages across 3 documents in under 75 seconds. The worker extracts atomic facts, normalizes units, and clusters related claims across documents."

---

### Part 3: The 3 Reconciliation Cases (00:55 – 01:45)
**On Screen**: Point to the summary cards (Corroborated, Contradictions, Reconciled). Click the filter buttons to show each case.

**What to Say**:
> "Once processed, the engine categorizes findings into 3 core reconciliation cases:
> 
> **First, Case 1: Corroboration**. When multiple documents agree — even across different units like Crores versus Millions — our engine mathematically normalizes them and marks them verified.
> 
> **Second, Case 2: Genuine Contradiction**. For example, in the Delhivery reports, PTL freight tonnage is cited as 1.4 million tons on page 6, but 1,579 thousand tons on page 9. SuperKnowledge explicitly flags this institutional discrepancy instead of guessing.
> 
> **Third, Case 3: Reconciled by Context**. Often, apparent conflicts are simply differences in precision or definition. For instance, Delhivery's active customer count is reported as *greater than 33,200* in the annual report, and *33,278* in the investor presentation. Our engine recognizes that one is a rounded figure and the other is exact, reconciling them with high confidence."

---

### Part 4: Audit Trail & Non-AI Guardrail (01:45 – 02:15)
**On Screen**: Click **"Inspect Audit Trail"** on a card. The side-by-side drawer opens showing the verbatim quotes and auditor rationale.

**What to Say**:
> "Opening the **Audit Workbench**, you see full transparency. Both source documents are displayed side-by-side with physical page numbers, verbatim source quotes, and our step-by-step auditor rationale.
> 
> Crucially, our **Deterministic Non-AI Guardrail** verifies every single quote with an exact algorithmic substring search against the raw PDF text. We don't use an LLM to judge an LLM — if a quote is hallucinated, it is immediately rejected with zero confidence."

---

### Part 5: PDF Export & Wrap-up (02:15 – 02:30)
**On Screen**: Click **"Export PDF Report"** in the top navbar. Show the generated vector audit report.

**What to Say**:
> "For enterprise audit and compliance, clicking **'Export PDF'** generates an immutable vector report with all evidence tables and rationale.
> 
> The system is deployed live on an Oracle Cloud VM at `superknowledge.avinashk47.me` with automated GitHub Actions CI/CD.
> 
> SuperKnowledge bridges the gap between raw document chaos and audit-ready truth. Thank you!"

---

## 💡 Practical Recording Tips

- **Keep It Moving**: Don't pause between clicks — click the filters as you mention each case.
- **Tone**: Speak calmly, confidently, and conversationally. You don't need to recite long numbers; just focus on *why* the engine works.
- **Tab Layout**:
  - Keep the live dashboard on one tab.
  - If you want to show code or architecture for 5 seconds, switch to the repo or `ARCHITECTURE_AND_WORKFLOW.md` during Part 2.
