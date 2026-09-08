export type FactRelationship =
  | "CORROBORATED"
  | "GENUINE_CONTRADICTION"
  | "APPARENT_CONTRADICTION_RECONCILED"
  | "UNMATCHED_SINGLETON";

export type CaseCategory =
  | "CASE_1_CORROBORATION"
  | "CASE_2_CONTRADICTION"
  | "CASE_3_RECONCILED_BY_CONTEXT"
  | "CASE_4_EXTRACTION_FAILURE"
  | "GENERAL_FACT";

export interface ExtractedFact {
  fact_id: string;
  doc_id: string;
  doc_name: string;
  page_number: number;
  entity: string;                     // e.g., "Delhivery Limited", "Indian Economy"
  metric: string;                     // e.g., "Revenue from Operations", "Real GDP Growth Rate"
  canonical_key: string;              // Normalized category key, e.g. "delhivery.revenue.fy24"
  value: string;                      // Display value e.g. "₹8,142 Cr", "6.4%"
  normalized_numeric_value?: number;  // Standardized unit value for comparison
  unit: string;                       // e.g., "INR Crores", "₹ Millions", "%", "PIN Codes"
  temporal_context: string;           // e.g., "FY24 (12M ended Mar 31, 2024)", "FY25 Advance Estimate"
  scope_qualifiers: Record<string, string>; // Dynamic: { accounting: "Consolidated" }, { series: "Real GDP" }
  exact_quote: string;                // Verbatim quote from PDF (Grounding)
  grounding_verified: boolean;        // Guardrail: exact substring verified against source page text
  guardrail_notes?: string;           // Notes if grounding failed or required whitespace normalization
  confidence_score: number;           // 0.0 - 1.0
}

export interface ReconciledFactGroup {
  group_id: string;
  topic: string;                      // e.g., "Delhivery FY24 Consolidated vs Standalone Revenue"
  entity: string;                     // e.g., "Delhivery Limited"
  relationship: FactRelationship;
  case_category: CaseCategory;
  confidence_score: number;
  facts: ExtractedFact[];
  verdict_summary: string;            // Concise 1-sentence audit verdict
  reasoning: string;                  // Detailed step-by-step contextual justification
  reconciliation_factors?: {
    temporal_difference?: string;     // e.g., "9 months vs 12 months"
    unit_difference?: string;         // e.g., "₹ Millions vs ₹ Crores (1 Cr = 10 M)"
    scope_difference?: string;        // e.g., "Standalone (Solo) vs Consolidated (Group)"
    methodology_difference?: string;  // e.g., "Advance Estimate vs RBI Monetary Policy Projection"
  };
}

export interface DocumentInfo {
  doc_id: string;
  doc_name: string;
  page_count: number;
  file_size: string;
  uploaded_at: string;
}

export interface DatasetSummary {
  dataset_id: string;
  dataset_name: string;
  description: string;
  documents: DocumentInfo[];
  total_facts: number;
  corroborated_count: number;
  contradiction_count: number;
  reconciled_count: number;
  failure_count: number;
  verification_rate: number;
  is_cached?: boolean;
  cached_at?: string;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface IngestJob {
  id: string;
  dataset_id: string;
  status: JobStatus;
  progress: number; // 0 to 100
  step: string;
  total_files: number;
  processed_files: number;
  error?: string;
  created_at: string;
  updated_at: string;
}
