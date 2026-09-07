import React, { useState, useMemo } from "react";
import { ReconciledFactGroup, CaseCategory } from "../lib/types";
import { RelationshipBadge, CaseBadge, GroundingBadge } from "./Badge";
import { Search, ChevronRight, FileText, Sparkles, Filter } from "lucide-react";

interface FactMatrixTableProps {
  groups: ReconciledFactGroup[];
  selectedGroup: ReconciledFactGroup | null;
  onSelectGroup: (group: ReconciledFactGroup) => void;
}

export function FactMatrixTable({
  groups,
  selectedGroup,
  onSelectGroup,
}: FactMatrixTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<string>("ALL");

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // 1. Case filter
      if (selectedCase !== "ALL" && group.case_category !== selectedCase) {
        return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      if (group.topic.toLowerCase().includes(q)) return true;
      if (group.entity.toLowerCase().includes(q)) return true;
      if (group.verdict_summary.toLowerCase().includes(q)) return true;

      for (const f of group.facts) {
        if (f.metric.toLowerCase().includes(q)) return true;
        if (f.value.toLowerCase().includes(q)) return true;
        if (f.doc_name.toLowerCase().includes(q)) return true;
        if (f.exact_quote.toLowerCase().includes(q)) return true;
      }

      return false;
    });
  }, [groups, selectedCase, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search metrics, entities, values, or quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Case Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedCase("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              selectedCase === "ALL"
                ? "bg-slate-800 text-white border border-white/10 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            All ({groups.length})
          </button>

          <button
            onClick={() => setSelectedCase("CASE_1_CORROBORATION")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCase === "CASE_1_CORROBORATION"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/5"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Case 1: Corroborated
          </button>

          <button
            onClick={() => setSelectedCase("CASE_2_CONTRADICTION")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCase === "CASE_2_CONTRADICTION"
                ? "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-rose-300 hover:bg-rose-500/5"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Case 2: Contradiction
          </button>

          <button
            onClick={() => setSelectedCase("CASE_3_RECONCILED_BY_CONTEXT")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCase === "CASE_3_RECONCILED_BY_CONTEXT"
                ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-amber-300 hover:bg-amber-500/5"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Case 3: Reconciled
          </button>

          <button
            onClick={() => setSelectedCase("CASE_4_EXTRACTION_FAILURE")}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCase === "CASE_4_EXTRACTION_FAILURE"
                ? "bg-violet-950/80 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-violet-300 hover:bg-violet-500/5"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Case 4: Guardrail Failure
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/5 bg-slate-900/40">
            <Filter className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-300">No matching facts found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching case filters.</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedGroup?.group_id === group.group_id;

            return (
              <div
                key={group.group_id}
                onClick={() => onSelectGroup(group)}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-slate-800/90 border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "bg-slate-900/60 hover:bg-slate-800/60 border-white/5 hover:border-white/15"
                }`}
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RelationshipBadge relationship={group.relationship} />
                    <CaseBadge category={group.case_category} />
                    <span className="text-xs text-slate-400 font-medium">
                      {group.entity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-[11px] text-slate-500">
                      {Math.round(group.confidence_score * 100)}% Confidence
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect Audit Trail <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Topic Title */}
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {group.topic}
                </h3>

                {/* Verdict Summary */}
                <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-2">
                  {group.verdict_summary}
                </p>

                {/* Fact Comparison Pills */}
                <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.facts.map((fact, idx) => (
                    <div
                      key={fact.fact_id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-1.5 text-[11px]">
                        <span className="font-semibold text-slate-300 truncate max-w-[140px]" title={fact.doc_name}>
                          {fact.doc_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                          p. {fact.page_number}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-1 mt-0.5">
                        <span className="text-sm font-bold text-white font-mono">{fact.value}</span>
                        <span className="text-[10px] text-slate-400 truncate">{fact.temporal_context}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/5">
                        <GroundingBadge verified={fact.grounding_verified} note={fact.guardrail_notes} />
                        <span className="text-[10px] text-slate-500 truncate max-w-[90px]">
                          {fact.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
