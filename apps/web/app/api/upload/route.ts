import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { parsePDF, chunkPDFPages } from "../../../lib/pdf-parser";
import { extractFactsFromChunk, reconcileCluster } from "../../../lib/fact-engine";
import { ExtractedFact, ReconciledFactGroup } from "../../../lib/types";

export const maxDuration = 120; // Allow sufficient time for multi-page extraction

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No PDF files provided" }, { status: 400 });
    }

    const tempDir = path.join(os.tmpdir(), `superknowledge-${crypto.randomUUID()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const allFacts: ExtractedFact[] = [];
    const docSummaries: { doc_id: string; doc_name: string; page_count: number; file_size: string }[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const tempFilePath = path.join(tempDir, file.name);
      fs.writeFileSync(tempFilePath, buffer);

      const docId = `doc-${crypto.randomUUID().slice(0, 8)}`;
      const docName = file.name.replace(".pdf", "");

      // 1. Layout-aware text extraction
      const parsed = await parsePDF(tempFilePath, docId, docName);
      docSummaries.push({
        doc_id: docId,
        doc_name: file.name,
        page_count: parsed.totalPages,
        file_size: `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`,
      });

      // 2. High-density page chunking (up to 8 pages per chunk for rate limit efficiency)
      // Limit to first 3 chunks (up to 24 pages) for fast interactive response if document is very large
      const chunks = chunkPDFPages(parsed.pages, 8);
      const chunksToProcess = chunks.slice(0, 3);

      for (const chunk of chunksToProcess) {
        const extracted = await extractFactsFromChunk(docId, docName, chunk);
        allFacts.push(...extracted);
      }

      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }

    // Clean up temp directory
    try {
      fs.rmdirSync(tempDir);
    } catch {}

    if (allFacts.length === 0) {
      return NextResponse.json({
        summary: {
          dataset_id: "custom-upload",
          dataset_name: "Uploaded Documents Analysis",
          description: "No facts could be extracted. Please check the PDF contents.",
          documents: docSummaries,
          total_facts: 0,
          corroborated_count: 0,
          contradiction_count: 0,
          reconciled_count: 0,
          failure_count: 0,
          verification_rate: 0,
        },
        groups: [],
      });
    }

    // 3. Cluster facts by (entity, canonical_key or topic)
    const clusterMap = new Map<string, { topic: string; entity: string; facts: ExtractedFact[] }>();

    for (const fact of allFacts) {
      // Form group key
      const key = `${fact.entity.toLowerCase()}::${fact.canonical_key.toLowerCase()}`;
      if (!clusterMap.has(key)) {
        clusterMap.set(key, {
          topic: `${fact.entity}: ${fact.metric}`,
          entity: fact.entity,
          facts: [],
        });
      }
      clusterMap.get(key)!.facts.push(fact);
    }

    // 4. Run Reconciliation Arbiter on each cluster
    const reconciledGroups: ReconciledFactGroup[] = [];

    for (const [_, cluster] of clusterMap.entries()) {
      const group = await reconcileCluster(cluster.topic, cluster.entity, cluster.facts);
      reconciledGroups.push(group);
    }

    // Calculate metrics
    let corroborated = 0;
    let contradictions = 0;
    let reconciled = 0;
    let failures = 0;
    let verifiedCount = 0;

    for (const g of reconciledGroups) {
      if (g.relationship === "CORROBORATED") corroborated++;
      else if (g.relationship === "GENUINE_CONTRADICTION") contradictions++;
      else if (g.relationship === "APPARENT_CONTRADICTION_RECONCILED") reconciled++;

      if (g.case_category === "CASE_4_EXTRACTION_FAILURE") failures++;

      for (const f of g.facts) {
        if (f.grounding_verified) verifiedCount++;
      }
    }

    const verificationRate =
      allFacts.length > 0 ? Number(((verifiedCount / allFacts.length) * 100).toFixed(1)) : 100;

    const payload = {
      summary: {
        dataset_id: "custom-upload",
        dataset_name: "Live Uploaded Documents",
        description: `Extracted and reconciled facts across ${docSummaries.length} uploaded PDF documents.`,
        documents: docSummaries,
        total_facts: allFacts.length,
        corroborated_count: corroborated,
        contradiction_count: contradictions,
        reconciled_count: reconciled,
        failure_count: failures,
        verification_rate: verificationRate,
      },
      groups: reconciledGroups,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: `Processing error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
