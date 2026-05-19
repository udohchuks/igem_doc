import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources, activityLog } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  await parser.load();
  const data = await parser.getText();
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

    // Upload to Supabase Storage
    let storageUrl: string | undefined;
    try {
      const fileName = `${workspaceId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(fileName, file, { contentType: file.type, upsert: true });
        
      if (uploadError) {
        console.error("[Storage] Upload error details:", uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(fileName);
        
      storageUrl = publicUrlData.publicUrl;
    } catch (storageErr) {
      console.error("[Storage] Upload failed, continuing without storage link:", storageErr);
    }

    // Insert pending resource. The Edge function will handle AI enrichment.
    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: file.type === "application/pdf" ? "pdf" : "doc",
      title: resourceTitle,
      fullText: rawText.trim(),
      status: "pending",
      metadata: storageUrl ? { storageUrl } : undefined,
    }).returning();

    await db.insert(activityLog).values({
      workspaceId,
      resourceId: inserted.id,
      userId: user.id,
      action: "added_resource",
    });

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/document] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
