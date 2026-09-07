"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { StatsOverview } from "../components/StatsOverview";
import { FactMatrixTable } from "../components/FactMatrixTable";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { UploadModal } from "../components/UploadModal";
import { DatasetSummary, ReconciledFactGroup } from "../lib/types";
import { Sparkles, Loader2, BookOpen, AlertCircle } from "lucide-react";

export default function Home() {
  const [activeDataset, setActiveDataset] = useState<string>("delhivery");
  const [data, setData] = useState<{ summary: DatasetSummary; groups: ReconciledFactGroup[] } | null>(null);
  const [customData, setCustomData] = useState<{ summary: DatasetSummary; groups: ReconciledFactGroup[] } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ReconciledFactGroup | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dataset when activeDataset changes
  useEffect(() => {
    if (activeDataset === "custom" && customData) {
      setData(customData);
      setSelectedGroup(customData.groups[0] || null);
      setLoading(false);
      return;
    }

    async function fetchDataset() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/datasets?id=${activeDataset}`);
        if (!res.ok) throw new Error("Failed to load dataset");
        const json = await res.json();
        setData(json);
        // Keep drawer closed initially so user sees the full overview table
        setSelectedGroup(null);
      } catch (err: any) {
        console.error("Failed to load dataset:", err);
        setError(err.message || "Could not fetch dataset");
      } finally {
        setLoading(false);
      }
    }

    fetchDataset();
  }, [activeDataset, customData]);

  const handleUploadSuccess = (uploadedData: { summary: DatasetSummary; groups: ReconciledFactGroup[] }) => {
    setCustomData(uploadedData);
    setActiveDataset("custom");
    setData(uploadedData);
    if (uploadedData.groups && uploadedData.groups.length > 0) {
      setSelectedGroup(uploadedData.groups[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        activeDataset={activeDataset}
        onSelectDataset={(id) => setActiveDataset(id)}
        onOpenUpload={() => setIsUploadOpen(true)}
        hasCustomDataset={!!customData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Assignment Mandatory Cases Spotlight Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Superjoin Assignment Showcase Cases</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              This system demonstrates all 4 required evaluation cases: corroborated figures across different units, genuine forecasting contradictions, apparent conflicts resolved by accounting scope, and OCR failure detection with verbatim grounding guardrails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Quick Cases:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Case 1: Corroboration
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Case 2: Contradiction
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Case 3: Reconciled
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
              Case 4: Guardrail Failure
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-300">Loading Fact Knowledge Layer...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Data View */}
        {!loading && data && (
          <div className="space-y-6">
            {/* Stats Telemetry Strip */}
            <StatsOverview summary={data.summary} />

            {/* Split View: Reconciled Fact Matrix */}
            <FactMatrixTable
              groups={data.groups}
              selectedGroup={selectedGroup}
              onSelectGroup={(grp) => setSelectedGroup(grp)}
            />
          </div>
        )}
      </main>

      {/* Side-by-Side Evidence Drawer */}
      <EvidenceDrawer
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
      />

      {/* Upload Custom PDFs Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        Superjoin VIT 2026 Engineering Intern Assignment • Fact Knowledge Layer • Built by Avinash Kushwaha
      </footer>
    </div>
  );
}
