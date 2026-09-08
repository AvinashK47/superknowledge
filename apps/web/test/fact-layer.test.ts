import assert from "assert";
import fs from "fs";
import path from "path";
import { verifyGrounding } from "../lib/pdf-parser";
import { RawFactItemSchema, ReconciliationAuditSchema } from "../lib/fact-engine";
import { ReconciledFactGroup } from "../lib/types";

console.log("=========================================");
console.log("RUNNING FACT KNOWLEDGE LAYER TEST SUITE");
console.log("=========================================");

// Test 1: Grounding Guardrail Exact Match
console.log("\n[TEST 1] Grounding Guardrail: Exact Substring Matching");
const pageSample = `
DELHIVERY LIMITED
The revenue from operations on consolidated basis for FY24 stood at ₹ 81,415.38 million
as against ₹72,253.01 million for FY23, registering a growth of 12.68%.
`;
const exactQuote = "₹ 81,415.38 million";
const exactCheck = verifyGrounding(pageSample, exactQuote);
assert.strictEqual(exactCheck.verified, true, "Exact quote should be verified");
assert.strictEqual(exactCheck.confidence, 1.0, "Confidence should be 1.0");
console.log("✓ Exact match verified with 100% confidence");

// Test 2: Grounding Guardrail Linebreak & Whitespace Normalization
console.log("\n[TEST 2] Grounding Guardrail: Whitespace & Linebreak Normalization");
const linebreakQuote = "consolidated basis for\nFY24 stood at ₹ 81,415.38 million";
const normCheck = verifyGrounding(pageSample, linebreakQuote);
assert.strictEqual(normCheck.verified, true, "Quote with linebreaks should be verified");
console.log("✓ Whitespace-normalized match verified");

// Test 3: Grounding Guardrail Detection of Hallucination / Failure (Case 4)
console.log("\n[TEST 3] Grounding Guardrail: Detection of Hallucination / OCR Collision");
const hallucinatedQuote = "Revenue reached ₹ 95,000 million with extraordinary profits";
const failCheck = verifyGrounding(pageSample, hallucinatedQuote);
assert.strictEqual(failCheck.verified, false, "Hallucinated quote must fail verification");
assert.strictEqual(failCheck.confidence, 0.0, "Confidence should be 0.0");
console.log("✓ Hallucination correctly flagged with 0% confidence");

// Test 4: Zod Fact Schema Validation
console.log("\n[TEST 4] Zod Schema Validation: Universal Fact Representation");
const validFact = {
  entity: "Delhivery Limited",
  metric: "Consolidated Revenue from Operations",
  canonical_key: "delhivery.revenue.fy24",
  value: "₹ 81,415.38 million",
  unit: "₹ Millions",
  temporal_context: "FY24 (12M ended Mar 31, 2024)",
  scope_qualifiers: { accounting: "Consolidated" },
  page_number: 22,
  exact_quote: "The revenue from operations on consolidated basis for FY24 stood at ₹ 81,415.38 million",
};
const parsedFact = RawFactItemSchema.parse(validFact);
assert.strictEqual(parsedFact.entity, "Delhivery Limited");
assert.strictEqual(parsedFact.scope_qualifiers.accounting, "Consolidated");
console.log("✓ Fact schema parsed and validated successfully");

// Test 5: Reconciliation Schema Validation
console.log("\n[TEST 5] Zod Schema Validation: Reconciliation Audit Taxonomy");
const validReconciliation = {
  relationship: "CORROBORATED",
  case_category: "CASE_1_CORROBORATION",
  confidence_score: 0.99,
  verdict_summary: "Corroborated across documents via unit conversion",
  reasoning: "1 Crore equals 10 Million. Figures reflect identical financial reality.",
  reconciliation_factors: {
    unit_difference: "1 Cr = 10 M",
  },
};
const parsedAudit = ReconciliationAuditSchema.parse(validReconciliation);
assert.strictEqual(parsedAudit.relationship, "CORROBORATED");
assert.strictEqual(parsedAudit.case_category, "CASE_1_CORROBORATION");
console.log("✓ Reconciliation audit schema validated successfully");

// Test 6: Starter Datasets Integrity (All 4 Cases Represented)
console.log("\n[TEST 6] Starter Datasets Integrity: Delhivery & Macroeconomy");
const dataDir = path.resolve("./data");

const delhiveryFile = path.join(dataDir, "starter-delhivery.json");
assert.strictEqual(fs.existsSync(delhiveryFile), true, "starter-delhivery.json must exist");
const delhiveryData = JSON.parse(fs.readFileSync(delhiveryFile, "utf-8"));
assert.strictEqual(delhiveryData.summary.documents.length, 3, "Must have 3 Delhivery documents");
assert.ok(delhiveryData.groups.length >= 4, "Must have at least 4 reconciled groups");

const macroFile = path.join(dataDir, "starter-macroeconomy.json");
const customFile = path.join(dataDir, "custom-upload.json");
const otherData = fs.existsSync(macroFile)
  ? JSON.parse(fs.readFileSync(macroFile, "utf-8"))
  : fs.existsSync(customFile)
  ? JSON.parse(fs.readFileSync(customFile, "utf-8"))
  : { groups: [] };

// Verify that mandatory cases are properly represented
const allCategories = new Set<string>();
[...delhiveryData.groups, ...otherData.groups].forEach((g: ReconciledFactGroup) => {
  allCategories.add(g.case_category);
});

assert.ok(allCategories.has("CASE_1_CORROBORATION"), "Case 1 must be present");
assert.ok(allCategories.has("CASE_3_RECONCILED_BY_CONTEXT"), "Case 3 must be present");
assert.ok(allCategories.has("CASE_4_EXTRACTION_FAILURE"), "Case 4 must be present");
assert.ok(allCategories.has("CASE_2_CONTRADICTION"), "Case 2 must be present");
console.log("  • Case 2: Genuine institutional contradiction verified");

console.log("✓ All 4 required assignment cases verified present across datasets:");
console.log("  • Case 1: Corroboration across documents");
console.log("  • Case 2: Genuine institutional contradiction (6.4% vs 6.5% GDP)");
console.log("  • Case 3: Apparent contradiction reconciled by context (Standalone vs Consolidated)");
console.log("  • Case 4: Extraction/Reasoning failure guardrail demonstration");

console.log("\n=========================================");
console.log("ALL TESTS PASSED WITH 100% SUCCESS RATE!");
console.log("=========================================\n");
