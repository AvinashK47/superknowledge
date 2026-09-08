import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReconciledFactGroup, ExtractedFact } from "@repo/shared";
import { getBackendBaseUrl } from "../lib/api-client";
import { RelationshipBadge, CaseBadge, GroundingBadge } from "./Badge";
import {
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  ShieldCheck,
  Scale,
  Clock,
  Coins,
  Layers,
  Sparkles,
} from "lucide-react";

interface EvidenceDrawerProps {
  group: ReconciledFactGroup | null;
  onClose: () => void;
}

// Map human-friendly document titles to actual file names on disk
const DOC_FILENAME_MAP: Record<string, string> = {
  "Delhivery Prospectus (2022 Excerpt)": "01-delhivery-prospectus-2022-excerpt.pdf",
  "Delhivery Prospectus 2022": "01-delhivery-prospectus-2022-excerpt.pdf",
  "Delhivery Annual Report (FY24 Excerpt)": "02-delhivery-annual-report-fy24-excerpt.pdf",
  "Delhivery Annual Report FY24": "02-delhivery-annual-report-fy24-excerpt.pdf",
  "Delhivery Q4 FY24 Earnings Presentation": "03-delhivery-q4-fy24-earnings-presentation.pdf",
  "01-india-economic-survey-2024-25-excerpt.pdf": "01-india-economic-survey-2024-25-excerpt.pdf",
  "Economic Survey 2024-25": "01-india-economic-survey-2024-25-excerpt.pdf",
  "02-rbi-annual-report-2024-25-excerpt.pdf": "02-rbi-annual-report-2024-25-excerpt.pdf",
  "RBI Annual Report": "02-rbi-annual-report-2024-25-excerpt.pdf",
  "03-imf-india-2025-article-iv-excerpt.pdf": "03-imf-india-2025-article-iv-excerpt.pdf",
  "IMF Article IV Report": "03-imf-india-2025-article-iv-excerpt.pdf",
};

export function EvidenceDrawer({ group, onClose }: EvidenceDrawerProps) {
  const [copiedFactId, setCopiedFactId] = useState<string | null>(null);
  const [isRationaleOpen, setIsRationaleOpen] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  if (!group) return null;

  const handleCopyCitation = (fact: ExtractedFact) => {
    const citation = `"${fact.exact_quote}" — Source: ${fact.doc_name}, Page ${fact.page_number} (${fact.metric}: ${fact.value} ${fact.unit})`;
    navigator.clipboard.writeText(citation);
    setCopiedFactId(fact.fact_id);
    setTimeout(() => setCopiedFactId(null), 2000);
  };

  const getDocFilename = (docName: string) => {
    return DOC_FILENAME_MAP[docName] || docName;
  };

  const getProvenanceViewUrl = (fact: ExtractedFact, factIndex: number) => {
    const backendUrl = getBackendBaseUrl();
    const filename = getDocFilename(fact.doc_name);
    const params = new URLSearchParams({
      doc: filename,
      page: fact.page_number.toString(),
      quote: fact.exact_quote,
      entity: fact.entity,
      metric: fact.metric,
      value: fact.value,
      unit: fact.unit || "",
      factNum: (factIndex + 1).toString(),
    });
    return `${backendUrl}/api/documents/provenance-view?${params.toString()}`;
  };

  const getRawPdfUrl = (fact: ExtractedFact) => {
    const backendUrl = getBackendBaseUrl();
    const filename = getDocFilename(fact.doc_name);
    return `${backendUrl}/api/documents/raw/${encodeURIComponent(filename)}#page=${fact.page_number}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8"
      aria-label="Close dossier"
    >
      {/* Centered Grand Forensic Audit Workbench */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1420px] bg-[#0c0f17] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-[#080a0f]/95 backdrop-blur-md flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <RelationshipBadge relationship={group.relationship} />
              <CaseBadge category={group.case_category} />
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {Math.round(group.confidence_score * 100)}% Confidence
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ID: {group.group_id}
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {group.topic}
              </h2>
              <span className="text-xs font-medium text-slate-400 font-mono">
                Entity: <strong className="text-slate-200">{group.entity}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
              Press ESC or click backdrop to exit
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/10 transition-colors border border-white/10"
              title="Close dossier"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Compact Executive Verdict Strip (NO Text Wall) */}
        <div className="px-6 py-3.5 bg-[#0e121b] border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start md:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 mr-2">
                Executive Verdict:
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                {group.verdict_summary}
              </span>
            </div>
          </div>

          {/* Toggle Step-by-Step Rationale Accordion */}
          <button
            onClick={() => setIsRationaleOpen(!isRationaleOpen)}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 hover:text-cyan-300 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/10 transition-colors shrink-0"
          >
            <span>{isRationaleOpen ? "Hide Auditor Rationale" : "View Auditor Rationale"}</span>
            {isRationaleOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Expandable Step-by-Step Rationale Accordion */}
        <AnimatePresence>
          {isRationaleOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-b border-white/[0.08] bg-[#0a0d14]"
            >
              <div className="p-6 space-y-4 max-w-5xl">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Step-by-Step Audit Rationale
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {group.reasoning}
                  </p>
                </div>

                {/* Structured Disambiguation Factors */}
                {group.reconciliation_factors && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                    {group.reconciliation_factors.unit_difference && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-medium text-amber-400">
                          <Coins className="w-3 h-3" />
                          <span>Unit Normalization</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {group.reconciliation_factors.unit_difference}
                        </p>
                      </div>
                    )}

                    {group.reconciliation_factors.scope_difference && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-medium text-purple-400">
                          <Layers className="w-3 h-3" />
                          <span>Scope / Perimeter</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {group.reconciliation_factors.scope_difference}
                        </p>
                      </div>
                    )}

                    {group.reconciliation_factors.temporal_difference && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-medium text-blue-400">
                          <Clock className="w-3 h-3" />
                          <span>Temporal Alignment</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {group.reconciliation_factors.temporal_difference}
                        </p>
                      </div>
                    )}

                    {group.reconciliation_factors.methodology_difference && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-medium text-emerald-400">
                          <Scale className="w-3 h-3" />
                          <span>Methodology / Agency</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {group.reconciliation_factors.methodology_difference}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Stage: Side-by-Side Comparative Evidence & Document Workbench */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Comparative Evidence & Source Citations</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({group.facts.length} independent document facts)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Click &quot;Open Quote in New Tab&quot; to inspect exact source page
            </span>
          </div>

          {/* Full Screen High-Density Comparative Grid */}
          <div
            className={`grid grid-cols-1 ${
              group.facts.length === 2
                ? "lg:grid-cols-2"
                : group.facts.length >= 3
                ? "lg:grid-cols-3"
                : "grid-cols-1"
            } gap-5`}
          >
            {group.facts.map((fact, index) => {
              const exactFilename = getDocFilename(fact.doc_name);
              const provenanceUrl = getProvenanceViewUrl(fact, index);
              const rawPdfUrl = getRawPdfUrl(fact);

              return (
                <motion.div
                  key={fact.fact_id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0e121a] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                >
                  {/* Document Identity & Action Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/10 text-white">
                            Fact {index + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Page {fact.page_number}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white leading-snug">
                          {fact.doc_name}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 truncate max-w-[280px]" title={exactFilename}>
                          File: {exactFilename}
                        </p>
                      </div>

                      {/* Direct Inspection Action Buttons */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <a
                          href={provenanceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
                          title="Open full page and quote in a new tab"
                        >
                          <span>Open Quote</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={rawPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                          title="Open native PDF viewer"
                        >
                          Raw PDF ↗
                        </a>
                      </div>
                    </div>

                    {/* Reported Metric & Value Display */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
                        {fact.metric}
                      </span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                          {fact.value}
                        </span>
                        {fact.unit && (
                          <span className="text-xs text-slate-400 font-mono">
                            ({fact.unit})
                          </span>
                        )}
                      </div>
                      {fact.temporal_context && (
                        <span className="text-[11px] text-slate-400 font-mono block">
                          Period: {fact.temporal_context}
                        </span>
                      )}
                    </div>

                    {/* Scope & Accounting Qualifiers */}
                    {Object.keys(fact.scope_qualifiers || {}).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {Object.entries(fact.scope_qualifiers).map(([k, v]) => (
                          <span
                            key={k}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                              v.toLowerCase().includes("standalone")
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                : v.toLowerCase().includes("consolidated")
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-white/[0.05] text-slate-300 border-white/5"
                            }`}
                          >
                            <span className="text-slate-500">{k}:</span> {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verbatim Quote (Anchored in Physical Document) */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="uppercase text-[10px] font-semibold text-cyan-400">
                        Verbatim Source Quote
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopyCitation(fact)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                        title="Copy citation"
                      >
                        {copiedFactId === fact.fact_id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    <blockquote className="p-3.5 rounded-xl bg-black/60 border border-white/[0.06] text-xs sm:text-[13px] text-slate-200 font-serif italic leading-relaxed">
                      &ldquo;{fact.exact_quote}&rdquo;
                    </blockquote>

                    {/* Grounding Verification Status */}
                    <div className="pt-2 flex items-center justify-between">
                      <GroundingBadge verified={fact.grounding_verified} />
                      {fact.guardrail_notes && (
                        <span
                          className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]"
                          title={fact.guardrail_notes}
                        >
                          {fact.guardrail_notes}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Workbench Footer Bar */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#080a0f] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verbatim Provenance Guardrail Engine • Anchored to Physical Page Bounds</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
          >
            Close Workbench (ESC)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
