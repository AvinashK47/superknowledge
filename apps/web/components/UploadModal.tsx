import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { DatasetSummary, ReconciledFactGroup } from "../lib/types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (data: { summary: DatasetSummary; groups: ReconciledFactGroup[] }) => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    setCurrentStep(1);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setCurrentStep(2); // PDF text extraction
      const timer1 = setTimeout(() => setCurrentStep(3), 3000); // Fact extraction
      const timer2 = setTimeout(() => setCurrentStep(4), 8000); // Grounding & Reconciliation

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Failed to process uploaded PDFs");
      }

      const data = await res.json();
      setCurrentStep(5); // Complete

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(data);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during processing");
      setIsUploading(false);
    }
  };

  const steps = [
    "Upload Staging",
    "Layout-Aware PDF Extraction",
    "Semantic Fact Extraction (Gemini Flash)",
    "Grounding Guardrail & Cross-Doc Reconciliation",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-950 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Upload Custom PDFs
              </h2>
              <p className="text-xs text-slate-400">
                Process new arbitrary documents with live fact discovery
              </p>
            </div>
          </div>

          {!isUploading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dropzone */}
        {!isUploading && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-900/30 hover:bg-slate-900/50 flex flex-col items-center justify-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="mt-1">
              <span className="text-sm font-semibold text-white">
                Drop your PDF documents here
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                or click to browse from your local device
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-1">
              Supports multiple files (financial statements, policy briefs, research papers)
            </span>
          </div>
        )}

        {/* Staged Files List */}
        {selectedFiles.length > 0 && !isUploading && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">
              Staged Documents ({selectedFiles.length})
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>

                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Processing Stepper */}
        {isUploading && (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <span className="text-sm font-bold text-white block">
                  Processing Knowledge Layer...
                </span>
                <span className="text-xs text-slate-400">
                  Parsing {selectedFiles.length} documents and reconciling facts
                </span>
              </div>
            </div>

            <div className="space-y-2.5 mt-4">
              {steps.map((stepText, idx) => {
                const stepNum = idx + 1;
                const isCompleted = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;

                return (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        isCompleted
                          ? "text-emerald-400 font-medium line-through"
                          : isCurrent
                          ? "text-white font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isUploading && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={selectedFiles.length === 0}
              onClick={handleProcessUpload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extract & Reconcile Facts</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
