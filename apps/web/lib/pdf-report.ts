import { jsPDF } from "jspdf";
import { DatasetSummary, ReconciledFactGroup } from "@repo/shared";

/**
 * Clean and sanitize text for jsPDF standard Helvetica font.
 * Replaces non-ASCII symbols like ₹ with INR, curly quotes with straight quotes, etc.
 */
function sanitizeText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[₹]/g, "INR ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "- ")
    .replace(/[^\x00-\x7F]/g, " ")
    .trim();
}

export function exportAnalysisPdfReport({
  summary,
  groups,
}: {
  summary: DatasetSummary;
  groups: ReconciledFactGroup[];
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededMm: number) {
    if (y + neededMm > pageHeight - 20) {
      doc.addPage();
      y = margin + 5;
      printRunningHeader();
    }
  }

  function printRunningHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 170);
    doc.text("SUPERKNOWLEDGE FACT VERIFICATION & RECONCILIATION AUDIT", margin, margin - 4);
    doc.setFont("helvetica", "normal");
    const rightText = sanitizeText(summary.dataset_name || "Document Analysis");
    doc.text(rightText.slice(0, 45), pageWidth - margin, margin - 4, { align: "right" });
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, margin - 1, pageWidth - margin, margin - 1);
  }

  // =========================================================================
  // 1. HEADER BANNER
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SUPERKNOWLEDGE AUDIT REPORT", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Cross-Document Fact Reconciliation, Verification & Verbatim Provenance Engine", margin + 6, y + 16);

  const metaStr = `Dataset: ${sanitizeText(summary.dataset_name)}  |  Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(metaStr, margin + 6, y + 26);

  y += 40;

  // =========================================================================
  // 2. EXECUTIVE TELEMETRY KPI SUMMARY
  // =========================================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("EXECUTIVE TELEMETRY OVERVIEW", margin, y);
  y += 5;

  const kpis = [
    { label: "Total Grounded Facts", value: String(summary.total_facts), sub: "Atomic claims verified", color: [30, 41, 59] },
    { label: "Case 1: Corroborations", value: String(summary.corroborated_count), sub: "Multi-doc agreement", color: [16, 185, 129] },
    { label: "Case 2: Contradictions", value: String(summary.contradiction_count), sub: "Genuine conflicts", color: [225, 29, 72] },
    { label: "Case 3: Reconciled", value: String(summary.reconciled_count), sub: "Scope / perimeter", color: [217, 119, 6] },
    { label: "Guardrail Pass Rate", value: `${summary.verification_rate}%`, sub: "Exact substring match", color: [6, 182, 212] },
  ];

  const cardWidth = (contentWidth - 8) / 5;
  const cardHeight = 22;

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 3, y + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, cardX + 3, y + 18);
  });

  y += cardHeight + 8;

  // =========================================================================
  // 3. SOURCE DOCUMENTS INVENTORY
  // =========================================================================
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`SOURCE DOCUMENTS ANALYZED (${summary.documents.length})`, margin, y);
  y += 4;

  summary.documents.forEach((docInfo) => {
    checkPageBreak(12);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(sanitizeText(docInfo.doc_name), margin + 4, y + 5.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${docInfo.page_count} Pages  |  Verified OCR Pass`, pageWidth - margin - 4, y + 5.2, { align: "right" });
    y += 10;
  });

  y += 4;

  // Separate groups by category
  const contradictions = groups.filter((g) => g.case_category === "CASE_2_CONTRADICTION" || g.relationship === "GENUINE_CONTRADICTION");
  const reconciliations = groups.filter((g) => g.case_category === "CASE_3_RECONCILED_BY_CONTEXT" || g.relationship === "APPARENT_CONTRADICTION_RECONCILED");
  const corroborations = groups.filter((g) => g.case_category === "CASE_1_CORROBORATION" || g.relationship === "CORROBORATED");

  // Helper to render Audit Rationale & Disambiguation Factors
  function renderAuditRationaleBox(
    grp: ReconciledFactGroup,
    accentColor: { bg: [number, number, number]; border: [number, number, number]; title: [number, number, number] }
  ) {
    const hasVerdict = Boolean(grp.verdict_summary);
    const hasReasoning = Boolean(grp.reasoning);
    const factors = grp.reconciliation_factors;
    const factorItems: { label: string; text: string }[] = [];
    if (factors) {
      if (factors.scope_difference) factorItems.push({ label: "Scope / Perimeter", text: factors.scope_difference });
      if (factors.temporal_difference) factorItems.push({ label: "Temporal Context", text: factors.temporal_difference });
      if (factors.unit_difference) factorItems.push({ label: "Unit Normalization", text: factors.unit_difference });
      if (factors.methodology_difference) factorItems.push({ label: "Methodology", text: factors.methodology_difference });
    }

    if (!hasVerdict && !hasReasoning && factorItems.length === 0) return;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const verdictLines = hasVerdict ? doc.splitTextToSize(sanitizeText(grp.verdict_summary), contentWidth - 14) : [];
    const reasoningLines = hasReasoning ? doc.splitTextToSize(sanitizeText(grp.reasoning), contentWidth - 14) : [];

    let factorLinesCount = 0;
    const splitFactors: { label: string; lines: string[] }[] = [];
    for (const f of factorItems) {
      const lines = doc.splitTextToSize(`${f.label}: ${sanitizeText(f.text)}`, contentWidth - 14);
      splitFactors.push({ label: f.label, lines });
      factorLinesCount += lines.length;
    }

    let boxHeight = 5;
    if (hasVerdict) boxHeight += 3.5 + verdictLines.length * 3.3;
    if (hasReasoning) boxHeight += 3.5 + reasoningLines.length * 3.3;
    if (splitFactors.length > 0) boxHeight += 3.5 + factorLinesCount * 3.3;

    checkPageBreak(boxHeight + 6);

    doc.setFillColor(accentColor.bg[0], accentColor.bg[1], accentColor.bg[2]);
    doc.setDrawColor(accentColor.border[0], accentColor.border[1], accentColor.border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 4, y, contentWidth - 8, boxHeight, 1.5, 1.5, "FD");

    let curY = y + 3.5;

    if (hasVerdict) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(accentColor.title[0], accentColor.title[1], accentColor.title[2]);
      doc.text("EXECUTIVE AUDIT VERDICT", margin + 7, curY);
      curY += 3.2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      doc.text(verdictLines, margin + 7, curY);
      curY += verdictLines.length * 3.3 + 1.8;
    }

    if (hasReasoning) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(accentColor.title[0], accentColor.title[1], accentColor.title[2]);
      doc.text("STEP-BY-STEP AUDIT RATIONALE", margin + 7, curY);
      curY += 3.2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(reasoningLines, margin + 7, curY);
      curY += reasoningLines.length * 3.3 + 1.8;
    }

    if (splitFactors.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(accentColor.title[0], accentColor.title[1], accentColor.title[2]);
      doc.text("STRUCTURED DISAMBIGUATION FACTORS", margin + 7, curY);
      curY += 3.2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      for (const sf of splitFactors) {
        doc.text(sf.lines, margin + 7, curY);
        curY += sf.lines.length * 3.3;
      }
    }

    y += boxHeight + 3;
  }

  // =========================================================================
  // 4. SECTION: GENUINE CONTRADICTIONS (CASE 2)
  // =========================================================================
  if (contradictions.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(190, 18, 60); // rose-700
    doc.text(`CASE 2: GENUINE CONTRADICTIONS (${contradictions.length} DETECTED)`, margin, y);
    y += 5;

    contradictions.forEach((grp, idx) => {
      checkPageBreak(45);
      doc.setFillColor(255, 241, 242); // rose-50
      doc.setDrawColor(254, 205, 211); // rose-200
      doc.setLineWidth(0.3);

      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(159, 18, 57);
      doc.text(`Conflict #${idx + 1}: ${sanitizeText(grp.topic)}`, margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Entity: ${sanitizeText(grp.entity || "Macroeconomy")} | Irreconcilable discrepancy detected across sources`, margin + 4, y + 9.5);

      y += 14;

      // Render Step-by-Step Audit Rationale & Executive Verdict
      renderAuditRationaleBox(grp, {
        bg: [255, 245, 245],
        border: [254, 205, 211],
        title: [159, 18, 57],
      });

      // Comparison Table of Conflicting Claims
      grp.facts.forEach((fact) => {
        checkPageBreak(20);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin + 4, y, contentWidth - 8, 14, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizeText(fact.doc_name), margin + 7, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(225, 29, 72);
        doc.text(sanitizeText(fact.value), margin + 70, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${fact.page_number}  |  ${sanitizeText(fact.temporal_context || "")}`, pageWidth - margin - 7, y + 4.5, { align: "right" });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const splitQuote = doc.splitTextToSize(`Quote: "${sanitizeText(fact.exact_quote)}"`, contentWidth - 18);
        doc.text(splitQuote.slice(0, 2), margin + 7, y + 9);

        y += 16;
      });

      y += 4;
    });
  }

  // =========================================================================
  // 5. SECTION: RECONCILED BY CONTEXT (CASE 3)
  // =========================================================================
  if (reconciliations.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`CASE 3: RECONCILED BY CONTEXT (${reconciliations.length} CASES)`, margin, y);
    y += 5;

    reconciliations.forEach((grp, idx) => {
      checkPageBreak(40);
      doc.setFillColor(254, 252, 232); // amber-50
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.setLineWidth(0.3);

      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(146, 64, 14);
      doc.text(`Reconciliation #${idx + 1}: ${sanitizeText(grp.topic)}`, margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Resolution: Contextual Disambiguation (${Math.round(grp.confidence_score * 100)}% Confidence)`, margin + 4, y + 9.5);

      y += 14;

      // Render Step-by-Step Audit Rationale & Disambiguation Factors
      renderAuditRationaleBox(grp, {
        bg: [255, 251, 235],
        border: [253, 230, 138],
        title: [146, 64, 14],
      });

      grp.facts.forEach((fact) => {
        checkPageBreak(18);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin + 4, y, contentWidth - 8, 14, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizeText(fact.doc_name), margin + 7, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(217, 119, 6);
        doc.text(sanitizeText(fact.value), margin + 70, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${fact.page_number}  |  ${sanitizeText(fact.temporal_context || "")}`, pageWidth - margin - 7, y + 4.5, { align: "right" });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const splitQuote = doc.splitTextToSize(`Quote: "${sanitizeText(fact.exact_quote)}"`, contentWidth - 18);
        doc.text(splitQuote.slice(0, 2), margin + 7, y + 9);

        y += 16;
      });

      y += 4;
    });
  }

  // =========================================================================
  // 6. SECTION: CORROBORATIONS (CASE 1)
  // =========================================================================
  if (corroborations.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`CASE 1: MULTI-DOCUMENT CORROBORATIONS (${corroborations.length} TOPICS)`, margin, y);
    y += 5;

    corroborations.forEach((grp, idx) => {
      checkPageBreak(32);
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.setLineWidth(0.3);

      doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text(`Corroborated #${idx + 1}: ${sanitizeText(grp.topic)}`, margin + 4, y + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Agreement confirmed across ${grp.facts.length} citations`, pageWidth - margin - 4, y + 4.8, { align: "right" });

      y += 12;

      // Render Step-by-Step Audit Rationale & Executive Verdict
      renderAuditRationaleBox(grp, {
        bg: [240, 253, 244],
        border: [187, 247, 208],
        title: [6, 95, 70],
      });

      grp.facts.forEach((fact) => {
        checkPageBreak(16);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin + 4, y, contentWidth - 8, 12, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizeText(fact.doc_name), margin + 7, y + 4.2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text(sanitizeText(fact.value), margin + 65, y + 4.2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${fact.page_number}`, pageWidth - margin - 7, y + 4.2, { align: "right" });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        const splitQuote = doc.splitTextToSize(`Quote: "${sanitizeText(fact.exact_quote)}"`, contentWidth - 18);
        doc.text(splitQuote.slice(0, 1), margin + 7, y + 8.5);

        y += 14;
      });

      y += 3;
    });
  }

  // =========================================================================
  // 7. VERBATIM PROVENANCE AUDIT SUMMARY
  // =========================================================================
  checkPageBreak(30);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("DETERMINISTIC VERBATIM GROUNDING AUDIT GUARANTEE", margin + 6, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const auditText = "All claims listed in this report are verified by a non-AI deterministic substring pass against the source PDF text layer extracted via spatial layout markers. Quotes that failed exact-match verification are flagged as extraction anomalies and excluded from corroborated sets.";
  const splitAudit = doc.splitTextToSize(auditText, contentWidth - 12);
  doc.text(splitAudit, margin + 6, y + 11);

  // =========================================================================
  // 8. PAGE FOOTERS
  // =========================================================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);

    doc.text("SuperKnowledge Fact Knowledge Layer  |  Confidential Audit Document", margin, pageHeight - margin + 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - margin + 6, { align: "right" });
  }

  // Trigger browser download with explicit application/pdf MIME type & open in new tab
  const sanitizedTitle = (summary.dataset_name || "document-analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30);
  const filename = `superknowledge-audit-report-${sanitizedTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;

  try {
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));

    // Create download link with explicit filename
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also open directly in a new browser tab for immediate viewing
    window.open(blobUrl, "_blank");
  } catch {
    // Fallback to standard doc.save()
    doc.save(filename);
  }
}
