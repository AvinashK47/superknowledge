import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { DatasetSummary, ReconciledFactGroup } from "@repo/shared";
import axios from "axios";
import { uploadPDFs } from "../lib/api-client";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (data: { summary: DatasetSummary; groups: ReconciledFactGroup[] }) => void;
  onJobStarted?: (jobId: string) => void;
  selectedModel?: string;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess, onJobStarted, selectedModel }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Escape" || e.code === "Escape") && !isUploading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUploading, onClose]);

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

    try {
      // 1. Try decoupled Express backend & Worker queue with Axios
      try {
        const uploadRes = await uploadPDFs(selectedFiles, { model: selectedModel });
        if (uploadRes && uploadRes.jobId) {
          setIsUploading(false);
          onJobStarted?.(uploadRes.jobId);
          onClose();
          return;
        }
      } catch (backendErr) {
        console.warn("Direct backend upload failed, trying local fallback:", backendErr);
      }

      // 2. Fallback to Next.js API route using Axios if backend is offline
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      setCurrentStep(2);
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setCurrentStep(4);

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess?.(data);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.error || err.message || "An unexpected error occurred during processing";
      setErrorMsg(msg);
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop: Clicking outside closes the modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (!isUploading) onClose();
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-[#0f1219] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 z-10"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
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

          {/* Helper Hint for India Macro */}
          {!isUploading && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Live Analysis Mode:</span>
                <p className="text-[11px] text-cyan-300/90 leading-relaxed">
                  You can select the 3 India Macro PDFs from <code className="bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono text-white">starter-datasets/india-macroeconomy/</code> to watch live layout extraction, fact discovery, and cross-document reconciliation in real time.
                </p>
              </div>
            </div>
          )}

          {/* Dropzone */}
          {!isUploading && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#141822] hover:bg-[#161c28] flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6 text-cyan-400" />
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#141822] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
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
            <div className="space-y-4 p-5 rounded-2xl bg-[#141822] border border-white/10">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
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
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={selectedFiles.length === 0}
                onClick={handleProcessUpload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract & Reconcile Facts</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
  );
}
