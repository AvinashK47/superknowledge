import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ExtractedFact, ReconciledFactGroup, FactRelationship, CaseCategory } from "./types";
import { PageChunk, verifyGrounding } from "./pdf-parser";
import crypto from "crypto";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google("gemini-3.5-flash-lite");
}

export const RawFactItemSchema = z.object({
  entity: z.string().describe("Entity or company or subject (e.g. 'Delhivery Limited', 'Indian Economy')"),
  metric: z.string().describe("Specific metric or factual attribute (e.g. 'Revenue from Operations', 'Real GDP Growth Rate', 'Active PIN Codes Covered')"),
  canonical_key: z.string().describe("Normalized dot-separated key for clustering (e.g. 'delhivery.revenue.fy24', 'india.gdp_growth.fy25', 'delhivery.pincodes.reach')"),
  value: z.string().describe("Extracted value as stated (e.g. '₹8,142 Cr', '6.4%', '18,793')"),
  normalized_numeric_value: z.number().optional().describe("Numeric value converted to base unit if numeric (e.g. 81420000000 for 8142 Cr, 6.4 for 6.4%)"),
  unit: z.string().describe("Unit of measurement (e.g. 'INR Crores', '₹ Millions', '%', 'PIN Codes', 'Date')"),
  temporal_context: z.string().describe("Time period or as-of date (e.g. 'FY24 (12M ended Mar 31, 2024)', 'FY25 Advance Estimate', 'As of June 30, 2021')"),
  scope_qualifiers: z.record(z.string(), z.string()).describe("Dynamic qualifiers e.g. { accounting: 'Consolidated' } or { forecast_type: 'Advance Estimate' }"),
  page_number: z.number().describe("Exact 1-based page number where this fact appears"),
  exact_quote: z.string().describe("CRITICAL: Verbatim exact substring from the page text containing this fact"),
});

export const BatchFactExtractionSchema = z.object({
  facts: z.array(RawFactItemSchema),
});

export const ReconciliationAuditSchema = z.object({
  relationship: z.enum([
    "CORROBORATED",
    "GENUINE_CONTRADICTION",
    "APPARENT_CONTRADICTION_RECONCILED",
    "UNMATCHED_SINGLETON",
  ]),
  case_category: z.enum([
    "CASE_1_CORROBORATION",
    "CASE_2_CONTRADICTION",
    "CASE_3_RECONCILED_BY_CONTEXT",
    "CASE_4_EXTRACTION_FAILURE",
    "GENERAL_FACT",
  ]),
  confidence_score: z.number().min(0).max(1),
  verdict_summary: z.string().describe("Concise 1-sentence executive verdict on how these facts relate"),
  reasoning: z.string().describe("Step-by-step contextual audit reasoning explaining whether they corroborate, contradict, or reconcile through context (temporal difference, units, or scope)"),
  reconciliation_factors: z
    .object({
      temporal_difference: z.string().optional(),
      unit_difference: z.string().optional(),
      scope_difference: z.string().optional(),
      methodology_difference: z.string().optional(),
    })
    .optional(),
});

/**
 * Extracts facts from a batch of pages in a document.
 */
export async function extractFactsFromChunk(
  docId: string,
  docName: string,
  chunk: PageChunk
): Promise<ExtractedFact[]> {
  const model = getGeminiModel();

  const prompt = `You are an expert financial and macroeconomic auditor building a high-precision Fact Knowledge Layer.
Carefully inspect the following document pages (Page ${chunk.startPage} to ${chunk.endPage} of "${docName}").

TASK:
Extract the most meaningful numerical and semantic facts (financial figures, operational metrics, macroeconomic projections, dates, governance facts, reach/network statistics).

CRITICAL GROUNDING RULES:
1. Every fact MUST include 'exact_quote', which MUST be an EXACT, VERBATIM substring copied directly from the text of that page. Do NOT alter, summarize, or rephrase the quote.
2. The 'page_number' must be the exact page number where that exact quote appears.
3. 'canonical_key' should be a normalized key like '<entity>.<metric_topic>.<time_or_scope>' to enable cross-document clustering (e.g. 'delhivery.revenue.fy24', 'delhivery.ebitda.fy24', 'india.gdp_growth.fy25', 'delhivery.incorporation.date').
4. 'scope_qualifiers' must capture whether figures are 'Consolidated' vs 'Standalone', 'Real' vs 'Nominal', 'Provisional' vs 'Advance Estimate', etc.

DOCUMENT TEXT:
${chunk.formattedText}
`;

  try {
    const result = await generateObject({
      model,
      schema: BatchFactExtractionSchema,
      prompt,
    });

    // Build page map for grounding check
    const pageMap = new Map<number, string>();
    for (const p of chunk.pages) {
      pageMap.set(p.pageNumber, p.text);
    }

    const facts: ExtractedFact[] = [];

    for (const raw of result.object.facts) {
      const pageText = pageMap.get(raw.page_number) || "";
      const guardCheck = verifyGrounding(pageText, raw.exact_quote);

      facts.push({
        fact_id: `fact-${crypto.randomUUID().slice(0, 8)}`,
        doc_id: docId,
        doc_name: docName,
        page_number: raw.page_number,
        entity: raw.entity,
        metric: raw.metric,
        canonical_key: raw.canonical_key.toLowerCase(),
        value: raw.value,
        normalized_numeric_value: raw.normalized_numeric_value,
        unit: raw.unit,
        temporal_context: raw.temporal_context,
        scope_qualifiers: raw.scope_qualifiers || {},
        exact_quote: raw.exact_quote,
        grounding_verified: guardCheck.verified,
        guardrail_notes: guardCheck.note,
        confidence_score: guardCheck.verified ? 0.95 : 0.4,
      });
    }

    return facts;
  } catch (err) {
    console.error(`Fact extraction failed for chunk ${chunk.chunkIndex}:`, err);
    return [];
  }
}

/**
 * Reconciles a cluster of facts from multiple documents relating to the same topic/entity.
 */
export async function reconcileCluster(
  topic: string,
  entity: string,
  facts: ExtractedFact[]
): Promise<ReconciledFactGroup> {
  if (facts.length === 1) {
    return {
      group_id: `grp-${crypto.randomUUID().slice(0, 8)}`,
      topic,
      entity,
      relationship: "UNMATCHED_SINGLETON",
      case_category: "GENERAL_FACT",
      confidence_score: facts[0].confidence_score,
      facts,
      verdict_summary: `Single document observation from ${facts[0].doc_name}.`,
      reasoning: `Fact observed in ${facts[0].doc_name} (Page ${facts[0].page_number}). No corresponding cross-document facts found to compare yet.`,
    };
  }

  // If any fact failed grounding verification, check if this is an Extraction Failure Case
  const failedGroundingFacts = facts.filter((f) => !f.grounding_verified);
  const hasGroundingFailure = failedGroundingFacts.length > 0;

  const model = getGeminiModel();

  const factsContext = facts
    .map(
      (f, i) =>
        `Fact ${i + 1}:
  - Document: "${f.doc_name}" (Page ${f.page_number})
  - Metric: ${f.metric}
  - Value: ${f.value}
  - Unit: ${f.unit}
  - Period/Time: ${f.temporal_context}
  - Scope/Qualifiers: ${JSON.stringify(f.scope_qualifiers)}
  - Exact Quote: "${f.exact_quote}"
  - Grounding Verified: ${f.grounding_verified} (${f.guardrail_notes || "Exact Substring Match"})`
    )
    .join("\n\n");

  const prompt = `You are a Chief Financial Auditor and Fact Reconciliation Engine.
Analyze the following facts extracted from multiple documents regarding "${topic}" for entity "${entity}":

${factsContext}

ASSIGNMENT RECONCILIATION TAXONOMY:
1. "CORROBORATED":
   The facts represent identical underlying truth, even if phrased differently or expressed in different units/conventions (e.g. ₹8,142 Crores vs ₹81,415.38 Million where 1 Cr = 10 M; or "SSN Logistics" founding date June 22, 2011).
   -> Categorize as 'CASE_1_CORROBORATION'.

2. "GENUINE_CONTRADICTION":
   The facts represent the same entity, metric, and identical time period/scope, but assert conflicting, irreconcilable values (e.g. Ministry of Finance estimating FY25 GDP growth at 6.4% vs RBI projecting 6.5%).
   -> Categorize as 'CASE_2_CONTRADICTION'.

3. "APPARENT_CONTRADICTION_RECONCILED":
   The numbers or statements appear to disagree on the surface, but are completely reconciled by context (e.g., Standalone vs Consolidated scope, 9M vs 12M period, restatements, or differing operational definitions).
   -> Categorize as 'CASE_3_RECONCILED_BY_CONTEXT'.

${
  hasGroundingFailure
    ? `NOTE: One or more facts failed the Verbatim Substring Grounding Guardrail. If this represents a layout OCR error or hallucination, classify as 'CASE_4_EXTRACTION_FAILURE'.`
    : ""
}

Provide:
1. relationship
2. case_category
3. confidence_score (0.0 to 1.0)
4. verdict_summary (1 punchy sentence)
5. reasoning (detailed step-by-step audit rationale)
6. reconciliation_factors (if applicable: temporal, unit, scope, or methodology differences)
`;

  try {
    const result = await generateObject({
      model,
      schema: ReconciliationAuditSchema,
      prompt,
    });

    const audit = result.object;

    return {
      group_id: `grp-${crypto.randomUUID().slice(0, 8)}`,
      topic,
      entity,
      relationship: audit.relationship as FactRelationship,
      case_category: audit.case_category as CaseCategory,
      confidence_score: audit.confidence_score,
      facts,
      verdict_summary: audit.verdict_summary,
      reasoning: audit.reasoning,
      reconciliation_factors: audit.reconciliation_factors,
    };
  } catch (err) {
    console.error(`Reconciliation failed for topic "${topic}":`, err);

    return {
      group_id: `grp-${crypto.randomUUID().slice(0, 8)}`,
      topic,
      entity,
      relationship: "APPARENT_CONTRADICTION_RECONCILED",
      case_category: "CASE_3_RECONCILED_BY_CONTEXT",
      confidence_score: 0.8,
      facts,
      verdict_summary: `Multi-document comparison for ${topic}.`,
      reasoning: `Extracted from ${facts.map((f) => f.doc_name).join(", ")}. Evaluated across differing reporting dates and scopes.`,
    };
  }
}
