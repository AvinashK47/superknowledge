"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { StatsOverview } from "../components/StatsOverview";
import { FactMatrixTable } from "../components/FactMatrixTable";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { UploadModal } from "../components/UploadModal";
import { JobProgressBanner } from "../components/JobProgressBanner";
import { DatasetSummary, ReconciledFactGroup } from "@repo/shared";
import {
  getDatasetDetail,
  getDatasets,
  triggerSampleProcessing,
  resetSession,
} from "../lib/api-client";
import { exportAnalysisPdfReport } from "../lib/pdf-report";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Cpu,
  Layers,
  HelpCircle,
  Server,
  Zap,
  Upload,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowRight,
  Play,
} from "lucide-react";

export default function Home() {
  const [activeDataset, setActiveDataset] = useState<string>("");
  const [, setAvailableDatasets] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [data, setData] = useState<{ summary: DatasetSummary; groups: ReconciledFactGroup[] } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ReconciledFactGroup | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showArchExplainer, setShowArchExplainer] = useState(false);

  // Sync available datasets from backend on mount
  const refreshAvailableDatasets = useCallback(async () => {
    try {
      const list = await getDatasets();
      setAvailableDatasets(list.map((d) => d.id));
      return list;
    } catch {
      return [];
    }
  }, []);

  // Initialize session: start raw by default, but restore if an active upload exists
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const list = await refreshAvailableDatasets();
        if (!mounted) return;
        if (list.length > 0 && list.some((d) => d.id === "custom")) {
          const detail = await getDatasetDetail("custom");
          if (mounted) {
            setData(detail);
            setActiveDataset("custom");
          }
        } else {
          if (mounted) {
            setData(null);
            setActiveDataset("");
          }
        }
      } catch {
        if (mounted) {
          setData(null);
          setActiveDataset("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [refreshAvailableDatasets]);

  // Load custom dataset when selected
  const loadDataset = useCallback(async (datasetId: string) => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const json = await getDatasetDetail(datasetId);
      setData(json);
      setSelectedGroup(null);
    } catch (err: any) {
      console.error("Failed to load dataset:", err);
      setError(err.message || "Could not fetch dataset from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger live worker execution on sample datasets (Delhivery or India Macro) from scratch
  const handleTriggerSample = async (sampleId: "delhivery" | "macroeconomy") => {
    setIsProcessing(true);
    setError(null);
    setData(null);
    try {
      const res = await triggerSampleProcessing(sampleId, { model: selectedModel });
      setActiveJobId(res.jobId);
    } catch (err: any) {
      alert(`Live processing trigger failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleJobFinished = async () => {
    setIsProcessing(false);
    setActiveJobId(null);
    setActiveDataset("custom");
    await refreshAvailableDatasets();
    await loadDataset("custom");
  };

  const handleUploadSuccess = (uploadedData: { summary: DatasetSummary; groups: ReconciledFactGroup[] }) => {
    setActiveDataset("custom");
    setData(uploadedData);
    if (uploadedData.groups && uploadedData.groups.length > 0) {
      setSelectedGroup(uploadedData.groups[0]);
    }
  };

  const handleJobStarted = (jobId: string) => {
    setActiveJobId(jobId);
    setIsProcessing(true);
    setActiveDataset("custom");
    setData(null);
  };

  const handleExportPdf = () => {
    if (!data) return;
    exportAnalysisPdfReport({ summary: data.summary, groups: data.groups });
  };

  const handleResetToRaw = async () => {
    try {
      await resetSession();
    } catch (err) {
      console.warn("Reset session call failed:", err);
    }
    setData(null);
    setActiveDataset("");
    setSelectedGroup(null);
    await refreshAvailableDatasets();
  };

  return (
    <div className="min-h-screen bg-[#08090c] bg-grid-pattern text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        hasActiveData={!!data}
        datasetName={data?.summary?.dataset_name}
        onOpenUpload={() => setIsUploadOpen(true)}
        onExportPdf={handleExportPdf}
        onResetToRaw={handleResetToRaw}
        isProcessing={isProcessing}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Background Worker Live Progress Banner */}
        <AnimatePresence>
          {activeJobId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <JobProgressBanner
                jobId={activeJobId}
                onJobFinished={handleJobFinished}
                onDismiss={() => {
                  setActiveJobId(null);
                  setIsProcessing(false);
                  loadDataset("custom");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial Loading Spinner */}
        {loading && (
          <div className="p-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-300">Initializing SuperKnowledge Workspace...</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* RAW STATE: BLANK CANVAS & INGESTION WORKSPACE                */}
        {/* ============================================================= */}
        {!loading && !data && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-8 py-4"
          >
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#11141e] via-[#0d0f17] to-[#090b0e] border border-white/[0.08] p-8 sm:p-12 shadow-2xl">
              {/* Subtle glowing background orb */}
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Raw Workspace • Zero Preloaded Data</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
                    Fact Verification & Cross-Document Reconciliation
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    Every analysis starts from scratch. Ingest multi-page PDFs, extract atomic claims with exact page and quote citations, enforce a deterministic non-AI grounding guardrail, and resolve cross-document contradictions.
                  </p>
                </div>

                {/* Primary Upload Action */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all font-sans"
                  >
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>Upload Documents to Analyze</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowArchExplainer(!showArchExplainer)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>{showArchExplainer ? "Hide Architecture" : "How The Pipeline Works"}</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Quick-Launch Sample Run Shortcuts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Or Run Sample Document Suites Live From Scratch</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delhivery Sample Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-2xl bg-[#0f1219] border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        3 Corporate Filings
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Live Extraction</span>
                    </div>
                    <h3 className="text-base font-bold text-white font-sans">
                      Delhivery Corporate & Financial Filings
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Prospectus 2022, FY24 Annual Report, and Q4 FY24 Earnings Presentation. Demonstrates PIN code coverage corroboration, headcount scope reconciliation, and revenue grounding.
                    </p>
                  </div>

                  <button
                    onClick={() => handleTriggerSample("delhivery")}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-[#141822] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Analyze Delhivery Live from Scratch</span>
                  </button>
                </motion.div>

                {/* India Macro Sample Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-2xl bg-[#0f1219] border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        3 Institutional Reports
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Macroeconomic Audit</span>
                    </div>
                    <h3 className="text-base font-bold text-white font-sans">
                      India Macroeconomy Institutional Reports
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Economic Survey 2024-25, RBI Annual Report, and IMF Article IV. Demonstrates genuine real GDP growth rate contradictions (6.4% vs 6.5%) and CPI Headline vs Core basket reconciliations.
                    </p>
                  </div>

                  <button
                    onClick={() => handleTriggerSample("macroeconomy")}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-[#141822] hover:bg-rose-500 hover:text-white text-rose-300 border border-rose-500/20 hover:border-rose-500 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Analyze India Macro Live from Scratch</span>
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Architecture Explainer (Expandable or Default) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Case 1: Corroboration</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Multi-Document Agreement</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically aligns identical facts across separate sources, normalizing numerical units and currencies.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Case 2: Contradiction</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Institutional Variance</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identifies irreconcilable discrepancies between authoritative bodies without inventing false consensus.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                  <GitCompare className="w-4 h-4" />
                  <span>Case 3: Reconciled</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Scope & Perimeter</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unpacks apparent conflicts by discovering accounting perimeter differences (Standalone vs Consolidated) or metric scope.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Case 4: Guardrails</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Verbatim Grounding</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deterministic exact substring match against spatial PDF text. OCR anomalies and hallucinated quotes fail immediately.
                </p>
              </div>
            </div>

            {/* Expandable Architecture Details */}
            <AnimatePresence>
              {showArchExplainer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 rounded-2xl bg-[#0f1219] border border-white/10 text-xs sm:text-sm text-slate-300 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#141822] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-semibold font-sans">
                          <Server className="w-4 h-4" />
                          <span>1. Decoupled Monorepo</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Next.js presentation dashboard (:3000) communicating with an Express REST orchestration API (:8000) and an asynchronous background processing worker.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#141822] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold font-sans">
                          <Cpu className="w-4 h-4" />
                          <span>2. Non-AI Grounding Guardrail</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          No black-box embeddings. Facts are extracted with exact quotes and page citations, then rigorously verified via deterministic substring matching.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#141822] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold font-sans">
                          <Zap className="w-4 h-4" />
                          <span>3. Pure Live Execution</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          No stale disk caches. Every document set uploaded is parsed, ground-checked, and cross-reconciled live in real time.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* ACTIVE DATA STATE: FACT MATRIX, STATS, & WORKBENCH            */}
        {/* ============================================================= */}
        {!loading && data && (
          <div className="space-y-6">
            {/* Stats Telemetry Strip with Export PDF & New Analysis Buttons */}
            <StatsOverview
              summary={data.summary}
              onExportPdf={handleExportPdf}
              onResetToRaw={handleResetToRaw}
            />

            {/* Split View: Reconciled Fact Matrix */}
            <FactMatrixTable
              groups={data.groups}
              selectedGroup={selectedGroup}
              onSelectGroup={(grp) => setSelectedGroup(grp)}
            />
          </div>
        )}
      </main>

      {/* Side-by-Side Grand Evidence Drawer (Workbench) */}
      <AnimatePresence>
        {selectedGroup && (
          <EvidenceDrawer
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </AnimatePresence>

      {/* Upload Custom PDFs Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={handleUploadSuccess}
            onJobStarted={handleJobStarted}
            selectedModel={selectedModel}
          />
        )}
      </AnimatePresence>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-white/[0.08] py-4 text-center text-xs text-slate-500">
        Superjoin Engineering Assignment • Fact Knowledge Layer • Turborepo Monorepo Architecture
      </footer>
    </div>
  );
}
