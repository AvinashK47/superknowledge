import React from "react";
import { FactRelationship, CaseCategory } from "../lib/types";
import { CheckCircle2, AlertTriangle, GitCompare, HelpCircle, ShieldCheck, ShieldAlert } from "lucide-react";

export function RelationshipBadge({ relationship }: { relationship: FactRelationship }) {
  switch (relationship) {
    case "CORROBORATED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Corroborated
        </span>
      );
    case "GENUINE_CONTRADICTION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Contradiction
        </span>
      );
    case "APPARENT_CONTRADICTION_RECONCILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <GitCompare className="w-3.5 h-3.5" />
          Reconciled by Context
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <HelpCircle className="w-3.5 h-3.5" />
          Single Source
        </span>
      );
  }
}

export function CaseBadge({ category }: { category: CaseCategory }) {
  switch (category) {
    case "CASE_1_CORROBORATION":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
          Case 1: Corroboration
        </span>
      );
    case "CASE_2_CONTRADICTION":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
          Case 2: Contradiction
        </span>
      );
    case "CASE_3_RECONCILED_BY_CONTEXT":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
          Case 3: Reconciled by Context
        </span>
      );
    case "CASE_4_EXTRACTION_FAILURE":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-950/60 text-violet-300 border border-violet-800/40">
          Case 4: Extraction Failure
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
          Standard Fact
        </span>
      );
  }
}

export function GroundingBadge({ verified, note }: { verified: boolean; note?: string }) {
  if (verified) {
    return (
      <span
        title={note || "Exact substring matched in PDF source text"}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
      >
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        Grounding Verified
      </span>
    );
  }
  return (
    <span
      title={note || "Failed verbatim check in PDF source text"}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20"
    >
      <ShieldAlert className="w-3 h-3 text-rose-400" />
      Ungrounded / Flagged
    </span>
  );
}
