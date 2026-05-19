import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { uploadDocumentToWorkspace, SHARED_FOLDER_ID } from "@/lib/drive";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, text, workspaceId } = body;

    if (!text || text.trim().length < 5 || !workspaceId) {
      return Response.json({ error: "Text (min 5 chars) and workspaceId are required." }, { status: 400 });
    }

    const resourceTitle = title?.trim() || "Untitled Note";

    // Save note to Google Drive as .txt
    let driveUrl: string | undefined;
    try {
      const buffer = Buffer.from(text.trim(), "utf-8");
      const driveRes = await uploadDocumentToWorkspace(
        `${workspaceId}/${resourceTitle}.txt`,
        "text/plain",
        buffer,
        SHARED_FOLDER_ID!
      );
      driveUrl = driveRes.webViewLink || undefined;
    } catch (driveErr) {
      console.error("[Drive] Note upload failed:", driveErr);
    }

    // Insert pending resource
    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "note",
      title: resourceTitle,
      fullText: text.trim(),
      status: "pending",
      metadata: driveUrl ? { driveUrl } : undefined,
    }).returning();

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/text] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
