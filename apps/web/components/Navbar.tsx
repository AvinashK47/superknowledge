import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Upload,
  FileText,
  Sparkles,
  ChevronDown,
  Zap,
  FileDown,
  RotateCcw,
} from "lucide-react";
import { checkBackendHealth } from "../lib/api-client";

interface NavbarProps {
  hasActiveData: boolean;
  datasetName?: string;
  onOpenUpload: () => void;
  onExportPdf?: () => void;
  onResetToRaw?: () => void;
  isProcessing: boolean;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

const MODEL_OPTIONS = [
  { id: "gemini-3.5-flash-lite", label: "Flash Lite", description: "Fast & High Quota" },
  { id: "gemini-3.5-flash", label: "Flash 3.5", description: "Standard" },
  { id: "gemini-3.7-flash", label: "Flash 3.7", description: "Advanced" },
];

export function Navbar({
  hasActiveData,
  datasetName,
  onOpenUpload,
  onExportPdf,
  onResetToRaw,
  isProcessing,
  selectedModel: propModel,
  onSelectModel,
}: NavbarProps) {
  const [backendStatus, setBackendStatus] = useState<{ ok: boolean; port?: number; latencyMs?: number }>({ ok: false });
  const [localModel, setLocalModel] = useState("gemini-3.5-flash-lite");
  const selectedModel = propModel || localModel;
  const handleSetModel = (m: string) => {
    setLocalModel(m);
    onSelectModel?.(m);
  };
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    async function ping() {
      const res = await checkBackendHealth();
      setBackendStatus({ ok: res.ok, port: res.port, latencyMs: res.latencyMs });
    }
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close model picker on outside click
  useEffect(() => {
    const handleClick = () => setShowModelPicker(false);
    if (showModelPicker) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showModelPicker]);

  const currentModelLabel = MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label || "Flash";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#090b0e]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Monorepo Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white font-sans">
                SuperKnowledge
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                Turborepo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Cross-Document Reconciliation & Verbatim Provenance Engine
            </p>
          </div>
        </div>

        {/* Center Indicator: Active Analysis vs Raw Workspace */}
        <div className="flex items-center">
          {hasActiveData ? (
            <div className="flex items-center gap-2 bg-[#11141c] px-3.5 py-1.5 rounded-xl border border-white/[0.08] text-xs font-medium text-slate-200 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="max-w-[220px] truncate">{datasetName || "Active Analysis"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Raw Workspace • Ready for Ingestion</span>
            </div>
          )}
        </div>

        {/* Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Backend Connection Indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all"
            style={{
              backgroundColor: backendStatus.ok ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
              borderColor: backendStatus.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
              color: backendStatus.ok ? "#34d399" : "#fb7185",
            }}
            title={backendStatus.ok ? `Express API :${backendStatus.port || 8000} live (${backendStatus.latencyMs}ms)` : "Backend server disconnected"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${backendStatus.ok ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}
            />
            <span>{backendStatus.ok ? `API :${backendStatus.port || 8000}` : "Offline"}</span>
          </div>

          {/* Export PDF Report Button (When Data Active) */}
          {hasActiveData && onExportPdf && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all shadow-sm"
              title="Export complete analysis report as a formatted PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export PDF</span>
            </motion.button>
          )}

          {/* New Analysis / Reset Button (When Data Active) */}
          {hasActiveData && onResetToRaw && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onResetToRaw}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-all"
              title="Reset workspace to raw canvas"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>New Analysis</span>
            </motion.button>
          )}

          {/* Model Picker Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModelPicker(!showModelPicker);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-all"
              title="Select Gemini model for processing"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{currentModelLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-[#12151e] border border-white/[0.12] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        handleSetModel(opt.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                        selectedModel === opt.id
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-slate-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{opt.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{opt.description}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenUpload}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all font-sans disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span>Upload PDFs</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
