import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "No dataset specified" }, { status: 400 });
  }

  const dataDir = path.join(process.cwd(), "data");
  const fileName = id === "custom" || id === "custom-upload" ? "custom-upload.json" : `${id}.json`;
  const filePath = path.join(dataDir, fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Dataset ${id} not found. Please upload documents to analyze.` }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(`Failed to load dataset ${id}:`, err);
    return NextResponse.json({ error: "Failed to load dataset" }, { status: 500 });
  }
}
