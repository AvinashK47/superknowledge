import React from "react";
import { motion } from "framer-motion";
import { DatasetSummary } from "@repo/shared";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  FileText,
  FileDown,
  RotateCcw,
} from "lucide-react";

interface StatsOverviewProps {
  summary: DatasetSummary;
  onExportPdf?: () => void;
  onResetToRaw?: () => void;
}

export function StatsOverview({
  summary,
  onExportPdf,
  onResetToRaw,
}: StatsOverviewProps) {
  const cards = [
    {
      title: "Total Grounded Facts",
      value: summary.total_facts,
      unit: "atomic claims",
      subtitle: "100% verified against source PDF text",
      icon: FileText,
      color: "text-slate-200",
      accent: "text-slate-400",
      bg: "bg-[#11141c]",
      border: "border-white/[0.08]",
    },
    {
      title: "Case 1: Corroborated",
      value: summary.corroborated_count,
      unit: "cross-verified",
      subtitle: "Multi-doc agreement / unit converted",
      icon: CheckCircle2,
      color: "text-emerald-400",
      accent: "text-emerald-500",
      bg: "bg-[#0d1614]",
      border: "border-emerald-500/20",
    },
    {
      title: "Case 2: Contradictions",
      value: summary.contradiction_count,
      unit: "genuine variance",
      subtitle: "Unreconciled institutional discrepancies",
      icon: AlertTriangle,
      color: "text-rose-400",
      accent: "text-rose-500",
      bg: "bg-[#180f13]",
      border: "border-rose-500/20",
    },
    {
      title: "Case 3: Reconciled",
      value: summary.reconciled_count,
      unit: "scope resolved",
      subtitle: "Standalone vs consol / basket scope",
      icon: GitCompare,
      color: "text-amber-400",
      accent: "text-amber-500",
      bg: "bg-[#17130c]",
      border: "border-amber-500/20",
    },
    {
      title: "Guardrail Provenance",
      value: `${summary.verification_rate}%`,
      unit: "verbatim match rate",
      subtitle: "Non-AI exact substring pass rate",
      icon: ShieldCheck,
      color: "text-cyan-400",
      accent: "text-cyan-500",
      bg: "bg-[#0c151c]",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info & Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1219] border border-white/[0.08] shadow-sm"
      >
        <div className="space-y-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              {summary.dataset_name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {summary.documents.length} Source Documents
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {summary.description}
          </p>
        </div>

        {/* Action Controls & Source Document Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Action Buttons: Export PDF & New Analysis */}
          <div className="flex items-center gap-2">
            {onExportPdf && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExportPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm"
                title="Download comprehensive PDF report of these findings"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Export PDF Report</span>
              </motion.button>
            )}

            {onResetToRaw && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onResetToRaw}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#141822] hover:bg-[#1a202c] text-slate-300 border border-white/10 transition-all shadow-sm"
                title="Clear current analysis and start fresh from raw workspace"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>New Analysis</span>
              </motion.button>
            )}
          </div>

          {/* Source Document Chips */}
          <div className="flex flex-wrap gap-1.5">
            {summary.documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141822] border border-white/[0.06] text-xs text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-medium truncate max-w-[140px]" title={doc.doc_name}>
                  {doc.doc_name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {doc.page_count}p
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* High-Density Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl ${card.bg} ${card.border} border flex flex-col justify-between shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span className="truncate pr-1">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.accent} shrink-0`} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${card.color}`}>
                  {card.value}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  {card.unit}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 truncate" title={card.subtitle}>
                {card.subtitle}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
