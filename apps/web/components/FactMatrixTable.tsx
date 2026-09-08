import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReconciledFactGroup, CaseCategory } from "@repo/shared";
import { RelationshipBadge, CaseBadge, GroundingBadge } from "./Badge";
import { Search, ChevronRight, FileText, X, ArrowUpRight } from "lucide-react";

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

  const filterTabs = [
    { id: "ALL", label: `All Cards (${groups.length})` },
    { id: "CASE_1_CORROBORATION", label: "Case 1: Corroborated", dot: "bg-emerald-400" },
    { id: "CASE_2_CONTRADICTION", label: "Case 2: Contradiction", dot: "bg-rose-400" },
    { id: "CASE_3_RECONCILED_BY_CONTEXT", label: "Case 3: Reconciled", dot: "bg-amber-400" },
    { id: "CASE_4_EXTRACTION_FAILURE", label: "Case 4: Guardrail Failure", dot: "bg-purple-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#0f1219] border border-white/[0.08]">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search metrics, entities, values, or source citations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#141822] border border-white/[0.06] text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Minimal Filter Tabs with Framer Motion Pill */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {filterTabs.map((tab) => {
            const isActive = selectedCase === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCase(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTab"
                    className="absolute inset-0 bg-white/[0.1] border border-white/[0.1] rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full relative z-10 ${tab.dot}`} />}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zero State */}
      {filteredGroups.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#0f1219] border border-white/[0.08] space-y-2">
          <p className="text-sm font-medium text-slate-300">No matching facts found</p>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or switching the category filter.
          </p>
        </div>
      )}

      {/* Fact Cluster Cards List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredGroups.map((group, index) => {
            const isSelected = selectedGroup?.group_id === group.group_id;
            return (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                whileHover={{ y: -2 }}
                onClick={() => onSelectGroup(group)}
                className={`group p-5 sm:p-6 rounded-2xl transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#141926] border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                    : "bg-[#0f1219] border-white/[0.08] hover:border-white/20 hover:bg-[#121620]"
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RelationshipBadge relationship={group.relationship} />
                    <CaseBadge category={group.case_category} />
                    <span className="text-xs text-slate-400 font-medium">
                      {group.entity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-mono text-slate-400">
                      {Math.round(group.confidence_score * 100)}% Confidence
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      <span>Inspect Audit Trail</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Card Title & Verdict */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-cyan-50 transition-colors">
                    {group.topic}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {group.verdict_summary}
                  </p>
                </div>

                {/* Multi-Document Claims Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                  {group.facts.map((fact, fIdx) => (
                    <div
                      key={fact.fact_id || fIdx}
                      className="p-3.5 rounded-xl bg-[#141822] border border-white/[0.04] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={fact.doc_name}>
                          <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="text-slate-300 truncate font-medium">
                            {fact.doc_name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                          p. {fact.page_number}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-bold font-mono text-white">
                          {fact.value}
                        </span>
                        {fact.temporal_context && (
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            {fact.temporal_context}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <GroundingBadge verified={fact.grounding_verified} />
                        {fact.unit && (
                          <span className="font-mono text-slate-400">
                            {fact.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
