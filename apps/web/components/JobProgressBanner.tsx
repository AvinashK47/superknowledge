import React, { useEffect, useState } from "react";
import { IngestJob } from "@repo/shared";
import { getJobStatus } from "../lib/api-client";
import { Loader2, CheckCircle2, AlertCircle, Cpu, X } from "lucide-react";

interface JobProgressBannerProps {
  jobId: string | null;
  onJobFinished: () => void;
  onDismiss?: () => void;
}

export function JobProgressBanner({ jobId, onJobFinished, onDismiss }: JobProgressBannerProps) {
  const [job, setJob] = useState<IngestJob | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let active = true;
    let errCount = 0;

    async function poll() {
      if (!jobId || !active) return;
      try {
        const data = await getJobStatus(jobId);
        if (active) {
          errCount = 0;
          setJob(data);
          if (data.status === "completed") {
            setTimeout(() => {
              if (active) onJobFinished();
            }, 1800);
            return;
          }
          if (data.status === "failed") {
            return;
          }
        }
      } catch (err) {
        errCount++;
        console.warn(`Error polling job status (${errCount}/3):`, err);
        if (active && errCount >= 3) {
          // If server restarted or job 404s, fail gracefully and allow dismissal
          setJob((prev) => ({
            id: jobId,
            dataset_id: "custom",
            status: "failed",
            progress: prev?.progress || 0,
            step: "Job was interrupted or no longer active on the server.",
            error: "Process was interrupted or not found. Dismiss to view existing analysis or re-run.",
            total_files: 0,
            processed_files: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          return;
        }
      }

      if (active) {
        setTimeout(poll, 1500);
      }
    }

    poll();

    return () => {
      active = false;
    };
  }, [jobId, onJobFinished]);

  if (!job) return null;

  const handleClose = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      onJobFinished();
    }
  };

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-3 duration-200 ${
      job.status === "completed"
        ? "bg-emerald-950/30 border-emerald-500/30"
        : job.status === "failed"
        ? "bg-rose-950/30 border-rose-500/30"
        : "bg-indigo-950/40 border-indigo-500/30"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            job.status === "completed"
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : job.status === "failed"
              ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
              : "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
          }`}>
            {job.status === "failed" ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : job.status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Cpu className="w-4 h-4 animate-pulse text-indigo-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {job.status === "completed"
                  ? "Reconciliation Complete"
                  : job.status === "failed"
                  ? "Processing Interrupted"
                  : "Background Worker Active"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                {job.id}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{job.step}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
            {job.status !== "failed" && job.status !== "completed" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            )}
            <span>{job.progress}% Complete</span>
          </div>

          <button
            onClick={handleClose}
            title="Dismiss progress banner"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            job.status === "failed"
              ? "bg-rose-500"
              : job.status === "completed"
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
          }`}
          style={{ width: `${Math.max(job.progress, 5)}%` }}
        />
      </div>

      {job.error && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-rose-400 font-medium">
          <p>Error: {job.error}</p>
          <button
            onClick={handleClose}
            className="text-xs underline text-rose-300 hover:text-white ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
