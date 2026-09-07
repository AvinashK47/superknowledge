import React, { useState } from "react";
import { ReconciledFactGroup, ExtractedFact } from "../lib/types";
import { RelationshipBadge, CaseBadge, GroundingBadge } from "./Badge";
import {
  X,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Brain,
  Scale,
  Clock,
  Coins,
  Layers,
} from "lucide-react";

interface EvidenceDrawerProps {
  group: ReconciledFactGroup | null;
  onClose: () => void;
}

export function EvidenceDrawer({ group, onClose }: EvidenceDrawerProps) {
  const [copiedFactId, setCopiedFactId] = useState<string | null>(null);

  if (!group) return null;

  const handleCopyCitation = (fact: ExtractedFact) => {
    const citation = `"${fact.exact_quote}" — Source: ${fact.doc_name}, Page ${fact.page_number} (${fact.metric}: ${fact.value} ${fact.unit})`;
    navigator.clipboard.writeText(citation);
    setCopiedFactId(fact.fact_id);
    setTimeout(() => setCopiedFactId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-slate-950 border-l border-white/10 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-slate-900/70">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <RelationshipBadge relationship={group.relationship} />
              <CaseBadge category={group.case_category} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                {Math.round(group.confidence_score * 100)}% Confidence
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {group.topic}
            </h2>
            <p className="text-xs text-slate-400">Entity: {group.entity}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* AI Auditor Verdict Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              <span>AI Auditor Contextual Reasoning</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Executive Verdict
              </span>
              <p className="text-sm font-medium text-white">{group.verdict_summary}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Step-by-Step Audit Rationale
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {group.reasoning}
              </p>
            </div>

            {/* Reconciliation Factors Breakdown */}
            {group.reconciliation_factors && (
              <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 gap-2 text-xs">
                {group.reconciliation_factors.unit_difference && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <Coins className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Unit Reconciliation</span>
                      <span>{group.reconciliation_factors.unit_difference}</span>
                    </div>
                  </div>
                )}

                {group.reconciliation_factors.scope_difference && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Scope / Perimeter Reconciliation</span>
                      <span>{group.reconciliation_factors.scope_difference}</span>
                    </div>
                  </div>
                )}

                {group.reconciliation_factors.temporal_difference && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Temporal Horizon</span>
                      <span>{group.reconciliation_factors.temporal_difference}</span>
                    </div>
                  </div>
                )}

                {group.reconciliation_factors.methodology_difference && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    <Scale className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Methodological / Institutional Basis</span>
                      <span>{group.reconciliation_factors.methodology_difference}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side-by-Side Source Evidence Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Source Grounding & Verbatim Evidence ({group.facts.length} citations)</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Verified against original PDF text
              </span>
            </div>

            <div className="space-y-4">
              {group.facts.map((fact, index) => (
                <div
                  key={fact.fact_id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3"
                >
                  {/* Evidence Card Top */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {fact.doc_name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 text-[11px] font-mono">
                        Page {fact.page_number}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCitation(fact)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors self-start sm:self-auto"
                    >
                      {copiedFactId === fact.fact_id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metric & Value Bar */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Metric</span>
                      <span className="font-semibold text-slate-200 truncate block" title={fact.metric}>
                        {fact.metric}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Reported Value</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm block">
                        {fact.value}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Period / Vintage</span>
                      <span className="font-medium text-slate-300 truncate block">
                        {fact.temporal_context}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Unit</span>
                      <span className="font-mono text-slate-400 block">{fact.unit}</span>
                    </div>
                  </div>

                  {/* Verbatim Quote Snippet Callout */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Verbatim Quote (Grounding Evidence)
                    </span>
                    <blockquote className="p-3 rounded-xl bg-slate-950/90 border-l-2 border-indigo-500 text-xs sm:text-sm text-slate-200 font-serif italic leading-relaxed">
                      &ldquo;{fact.exact_quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* Guardrail Status Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <GroundingBadge
                      verified={fact.grounding_verified}
                      note={fact.guardrail_notes}
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {fact.guardrail_notes || "Verified Exact Substring"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
