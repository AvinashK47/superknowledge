import React from "react";
import { DatasetSummary } from "../lib/types";
import { ShieldCheck, CheckCircle2, AlertTriangle, GitCompare, FileText, Bug } from "lucide-react";

interface StatsOverviewProps {
  summary: DatasetSummary;
}

export function StatsOverview({ summary }: StatsOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-2xl glass-panel border border-white/10 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {summary.dataset_name}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {summary.documents.length} Source Documents
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-3xl">
            {summary.description}
          </p>
        </div>

        {/* Source Document Chips */}
        <div className="flex flex-wrap gap-2">
          {summary.documents.map((doc) => (
            <div
              key={doc.doc_id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-300"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium truncate max-w-[180px]" title={doc.doc_name}>
                {doc.doc_name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {doc.page_count} pgs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Grounded Facts */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Grounded Facts</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{summary.total_facts}</span>
            <span className="text-[11px] text-slate-500">facts discovered</span>
          </div>
        </div>

        {/* Corroborations */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
            <span>Case 1: Corroborated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {summary.corroborated_count}
            </span>
            <span className="text-[11px] text-emerald-500/80">cross-verified</span>
          </div>
        </div>

        {/* Contradictions */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium">
            <span>Case 2: Contradictions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {summary.contradiction_count}
            </span>
            <span className="text-[11px] text-rose-500/80">unreconciled variance</span>
          </div>
        </div>

        {/* Reconciled by Context */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300 text-xs font-medium">
            <span>Case 3: Reconciled</span>
            <GitCompare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {summary.reconciled_count}
            </span>
            <span className="text-[11px] text-amber-500/80">scope / time / unit</span>
          </div>
        </div>

        {/* Grounding Verification Guardrail Rate */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
            <span>Guardrail Provenance</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400 font-mono">
              {summary.verification_rate}%
            </span>
            <span className="text-[11px] text-indigo-400/70">verbatim match rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
