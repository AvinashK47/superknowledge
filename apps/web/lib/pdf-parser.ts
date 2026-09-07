import { execSync } from "child_process";
import fs from "fs";

export interface ParsedPDFPage {
  pageNumber: number;
  text: string;
}

export interface ParsedPDFResult {
  docId: string;
  docName: string;
  totalPages: number;
  pages: ParsedPDFPage[];
}

export interface PageChunk {
  chunkIndex: number;
  startPage: number;
  endPage: number;
  formattedText: string;
  pages: ParsedPDFPage[];
}

/**
 * Normalizes text for comparison (collapses multiple whitespaces and newlines)
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

/**
 * Verifies if an extracted quote exists verbatim or near-verbatim in page text.
 * Implements the assignment Grounding Guardrail (Defense-in-depth).
 */
export function verifyGrounding(
  pageText: string,
  quote: string
): { verified: boolean; confidence: number; note?: string } {
  if (!quote || quote.trim().length === 0) {
    return { verified: false, confidence: 0, note: "Empty quote provided" };
  }

  const cleanPage = pageText.toLowerCase();
  const cleanQuote = quote.toLowerCase().trim();

  // 1. Exact substring match
  if (cleanPage.includes(cleanQuote)) {
    return { verified: true, confidence: 1.0 };
  }

  // 2. Whitespace-normalized match (handles PDF linebreaks and tab indents)
  const normPage = normalizeText(cleanPage);
  const normQuote = normalizeText(cleanQuote);
  if (normPage.includes(normQuote)) {
    return {
      verified: true,
      confidence: 0.95,
      note: "Verified after linebreak & whitespace normalization",
    };
  }

  // 3. Punctuation-relaxed match (handles curly quotes, dashes, en-dashes)
  const stripSymbols = (s: string) =>
    s
      .replace(/[“”"']/g, "")
      .replace(/[–—−-]/g, "-")
      .replace(/\s+/g, " ");

  if (stripSymbols(normPage).includes(stripSymbols(normQuote))) {
    return {
      verified: true,
      confidence: 0.9,
      note: "Verified with relaxed punctuation/dash normalization",
    };
  }

  // 4. Token overlap check (handles line-wrapping across PDF columns and bullet characters like 'y ')
  const quoteTokens = normQuote
    .replace(/^y\s+/, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (quoteTokens.length > 2) {
    let matchedTokens = 0;
    for (const token of quoteTokens) {
      if (normPage.includes(token)) matchedTokens++;
    }
    const tokenRatio = matchedTokens / quoteTokens.length;
    if (tokenRatio >= 0.9) {
      return {
        verified: true,
        confidence: Number(tokenRatio.toFixed(2)),
        note: `Verified (${Math.round(tokenRatio * 100)}% token alignment across PDF layout breaks)`,
      };
    } else if (tokenRatio >= 0.7) {
      return {
        verified: false,
        confidence: Number(tokenRatio.toFixed(2)),
        note: `Grounding partial match (${Math.round(tokenRatio * 100)}% token overlap). Possible LLM paraphrase or layout split.`,
      };
    }
  }

  return {
    verified: false,
    confidence: 0.0,
    note: "Quote not found in source page text (hallucination or wrong page attribution)",
  };
}

/**
 * Extracts text page-by-page from a PDF file path or buffer.
 * Prefers `pdftotext -layout` for column preservation, with fallback to PDFParse.
 */
export async function parsePDF(
  filePath: string,
  docId: string,
  docName: string
): Promise<ParsedPDFResult> {
  const pages: ParsedPDFPage[] = [];

  // Method 1: pdftotext -layout (Fastest, best column preservation)
  try {
    const rawOutput = execSync(`pdftotext -layout "${filePath}" -`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });

    const splitPages = rawOutput.split("\x0c");
    // The last element is often empty due to trailing formfeed
    if (splitPages.length > 1 && splitPages[splitPages.length - 1].trim() === "") {
      splitPages.pop();
    }

    splitPages.forEach((pageText, idx) => {
      pages.push({
        pageNumber: idx + 1,
        text: pageText,
      });
    });

    if (pages.length > 0) {
      return {
        docId,
        docName,
        totalPages: pages.length,
        pages,
      };
    }
  } catch (err) {
    console.warn("pdftotext command not available or failed, falling back to PDFParse:", err);
  }

  // Method 2: PDFParse fallback
  try {
    const { PDFParse } = await import("pdf-parse");
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();

    // If result has individual pages:
    if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
      result.pages.forEach((p: { num?: number; text?: string }, idx: number) => {
        pages.push({
          pageNumber: p.num ?? idx + 1,
          text: p.text ?? "",
        });
      });
    } else {
      // Fallback if pages not individually separated: split by \x0c or chunking
      const splitPages = result.text.split("\x0c");
      splitPages.forEach((pageText: string, idx: number) => {
        pages.push({
          pageNumber: idx + 1,
          text: pageText,
        });
      });
    }

    return {
      docId,
      docName,
      totalPages: pages.length,
      pages,
    };
  } catch (fallbackErr) {
    throw new Error(`Failed to parse PDF ${filePath}: ${fallbackErr}`);
  }
}

/**
 * Batches PDF pages into chunks with delimiter markers for high-density, rate-limit friendly extraction.
 */
export function chunkPDFPages(pages: ParsedPDFPage[], chunkSize = 8): PageChunk[] {
  const chunks: PageChunk[] = [];

  for (let i = 0; i < pages.length; i += chunkSize) {
    const chunkPages = pages.slice(i, i + chunkSize);
    const startPage = chunkPages[0].pageNumber;
    const endPage = chunkPages[chunkPages.length - 1].pageNumber;

    const formattedText = chunkPages
      .map(
        (p) => `\n--- START OF PAGE ${p.pageNumber} ---\n${p.text}\n--- END OF PAGE ${p.pageNumber} ---\n`
      )
      .join("\n");

    chunks.push({
      chunkIndex: Math.floor(i / chunkSize),
      startPage,
      endPage,
      formattedText,
      pages: chunkPages,
    });
  }

  return chunks;
}
