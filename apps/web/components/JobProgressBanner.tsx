import React, { useEffect, useState } from "react";
import { IngestJob } from "@repo/shared";
import { getJobStatus } from "../lib/api-client";
import { Loader2, CheckCircle2, AlertCircle, Cpu } from "lucide-react";

interface JobProgressBannerProps {
  jobId: string | null;
  onJobFinished: () => void;
}

export function JobProgressBanner({ jobId, onJobFinished }: JobProgressBannerProps) {
  const [job, setJob] = useState<IngestJob | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let active = true;

    async function poll() {
      if (!jobId || !active) return;
      try {
        const data = await getJobStatus(jobId);
        if (active) {
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
        console.warn("Error polling job status:", err);
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
                  ? "Processing Failed"
                  : "Background Worker Active"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                {job.id}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{job.step}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono text-indigo-300">
          {job.status !== "failed" && job.status !== "completed" && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          )}
          <span>{job.progress}% Complete</span>
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
        <p className="mt-2 text-xs text-rose-400 font-medium">Error: {job.error}</p>
      )}
    </div>
  );
}
