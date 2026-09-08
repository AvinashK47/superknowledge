import React from "react";
import { FactRelationship, CaseCategory } from "@repo/shared";
import { CheckCircle2, AlertTriangle, GitCompare, HelpCircle, ShieldCheck, ShieldAlert } from "lucide-react";

export function RelationshipBadge({ relationship }: { relationship: FactRelationship }) {
  switch (relationship) {
    case "CORROBORATED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Corroborated
        </span>
      );
    case "GENUINE_CONTRADICTION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" />
          Contradiction
        </span>
      );
    case "APPARENT_CONTRADICTION_RECONCILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <GitCompare className="w-3 h-3" />
          Reconciled by Context
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <HelpCircle className="w-3 h-3" />
          Single Source
        </span>
      );
  }
}

export function CaseBadge({ category }: { category: CaseCategory }) {
  switch (category) {
    case "CASE_1_CORROBORATION":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          Case 1: Corroboration
        </span>
      );
    case "CASE_2_CONTRADICTION":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
          Case 2: Contradiction
        </span>
      );
    case "CASE_3_RECONCILED_BY_CONTEXT":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
          Case 3: Reconciled
        </span>
      );
    case "CASE_4_EXTRACTION_FAILURE":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
          Case 4: Guardrail Failure
        </span>
      );
    default:
      return null;
  }
}

export function GroundingBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        Grounding Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <ShieldAlert className="w-3 h-3 text-rose-400" />
      Ungrounded / Flagged
    </span>
  );
}
