import axios from "axios";
import { DatasetSummary, ReconciledFactGroup, IngestJob } from "@repo/shared";

export function getBackendBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL !== undefined) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== "undefined") {
    if (!window.location.port || window.location.port === "80" || window.location.port === "443") {
      return "";
    }
  }
  return "http://localhost:8000";
}

const BACKEND_URL = getBackendBaseUrl();

// Axios client configured for backend API
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    "Accept": "application/json",
  },
});

export interface DatasetItem {
  id: string;
  name: string;
  docCount: number;
  description: string;
}

export interface DatasetDetail {
  summary: DatasetSummary;
  groups: ReconciledFactGroup[];
}

/**
 * Ping backend health endpoint using Axios
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; port?: number; latencyMs?: number }> {
  const start = Date.now();
  try {
    const res = await api.get("/api/health");
    const latencyMs = Date.now() - start;
    if (res.status === 200 && res.data?.status === "ok") {
      return { ok: true, port: res.data.port, latencyMs };
    }
    return { ok: false, latencyMs };
  } catch {
    return { ok: false };
  }
}

/**
 * Fetch available datasets list using Axios
 */
export async function getDatasets(): Promise<DatasetItem[]> {
  try {
    const res = await api.get("/api/datasets");
    return res.data || [];
  } catch (err) {
    console.warn("Backend unavailable or no datasets:", err);
    return [];
  }
}

/**
 * Fetch full dataset facts, metadata, and reconciliation details using Axios
 */
export async function getDatasetDetail(id: string): Promise<DatasetDetail> {
  try {
    const res = await api.get(`/api/datasets/${id}`);
    return res.data;
  } catch (err: any) {
    console.warn(`Backend fetch failed for ${id}, falling back to Next.js route:`, err.message);
    const fallbackRes = await axios.get(`/api/datasets?id=${id}`);
    return fallbackRes.data;
  }
}

/**
 * Upload arbitrary PDF documents to Express backend using Axios multipart/form-data
 */
export async function uploadPDFs(
  files: File[],
  options?: { model?: string }
): Promise<{ jobId: string; message: string }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (options?.model) {
    formData.append("model", options.model);
  }

  try {
    const res = await api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || "Upload failed";
    throw new Error(errorMsg);
  }
}

/**
 * Trigger live background worker processing of sample PDFs (Delhivery or India Macro) from scratch
 */
export async function triggerSampleProcessing(
  sampleId: "delhivery" | "macroeconomy",
  options?: { model?: string }
): Promise<{ jobId: string; message: string }> {
  try {
    const res = await api.post("/api/sample/process", {
      sampleId,
      model: options?.model || "gemini-3.5-flash-lite",
    });
    return res.data;
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || "Failed to trigger sample processing";
    throw new Error(errorMsg);
  }
}

/**
 * Reset active session back to raw canvas, purging current working data
 */
export async function resetSession(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post("/api/session/reset");
    return res.data;
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || "Failed to reset session";
    throw new Error(errorMsg);
  }
}

/**
 * Poll background worker job status using Axios
 */
export async function getJobStatus(jobId: string): Promise<IngestJob> {
  try {
    const res = await api.get(`/api/jobs/${jobId}`);
    return res.data;
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || "Job not found";
    throw new Error(errorMsg);
  }
}

