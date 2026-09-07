import React from "react";
import { Layers, Upload, Database, FileText, CheckCircle2, Sparkles } from "lucide-react";

interface NavbarProps {
  activeDataset: string;
  onSelectDataset: (id: string) => void;
  onOpenUpload: () => void;
  hasCustomDataset: boolean;
}

export function Navbar({
  activeDataset,
  onSelectDataset,
  onOpenUpload,
  hasCustomDataset,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                SuperKnowledge
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Fact Layer v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Cross-Document Reconciliation & Verbatim Provenance Engine
            </p>
          </div>
        </div>

        {/* Dataset Switcher Pills */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => onSelectDataset("delhivery")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeDataset === "delhivery"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dataset 1:</span> Delhivery (3 Docs)
          </button>

          <button
            onClick={() => onSelectDataset("macroeconomy")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeDataset === "macroeconomy"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dataset 2:</span> India Macro (3 Docs)
          </button>

          {hasCustomDataset && (
            <button
              onClick={() => onSelectDataset("custom")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeDataset === "custom"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Uploads
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New PDFs</span>
          </button>
        </div>
      </div>
    </header>
  );
}
