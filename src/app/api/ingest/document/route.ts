import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { uploadDocumentToWorkspace, SHARED_FOLDER_ID, isDriveReady } from "@/lib/drive";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse: any = await import("pdf-parse" as any);
  const parse = pdfParse.default ?? pdfParse;
  const data = await parse(buffer);
  return data.text;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titleField = formData.get("title");
    const workspaceId = formData.get("workspaceId") as string;
    const title = typeof titleField === "string" ? titleField.trim() : undefined;

    if (!file || !workspaceId) {
      return Response.json({ error: "File and workspaceId are required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText: string;
    if (file.type === "application/pdf") {
      rawText = await extractTextFromPdf(buffer);
    } else {
      rawText = buffer.toString("utf-8");
    }

    if (!rawText || rawText.trim().length < 10) {
      return Response.json({ error: "Could not extract readable text." }, { status: 422 });
    }

    const resourceTitle = title || file.name.replace(/\.[^.]+$/, "");

    // Upload to Google Drive (only if configured)
    let driveUrl: string | undefined;
    if (isDriveReady) {
      try {
        const driveRes = await uploadDocumentToWorkspace(
          `${workspaceId}/${resourceTitle}.${file.name.split('.').pop()}`,
          file.type,
          buffer,
          SHARED_FOLDER_ID!
        );
        driveUrl = driveRes.webViewLink || undefined;
      } catch (driveErr) {
        console.error("[Drive] Upload failed, continuing without Drive link:", driveErr);
      }
    }

    // Insert pending resource. The Edge function will handle AI enrichment.
    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: file.type === "application/pdf" ? "pdf" : "doc",
      title: resourceTitle,
      fullText: rawText.trim(),
      status: "pending",
      metadata: driveUrl ? { driveUrl } : undefined,
    }).returning();

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/document] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
