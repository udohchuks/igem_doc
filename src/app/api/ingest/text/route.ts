import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources, activityLog } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

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

    // Save note to Supabase Storage as .txt
    let storageUrl: string | undefined;
    try {
      const fileName = `${workspaceId}/${Date.now()}-${resourceTitle.replace(/[^a-zA-Z0-9.-]/g, '_')}.txt`;
      const blob = new Blob([text.trim()], { type: "text/plain" });
      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(fileName, blob, { contentType: "text/plain", upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(fileName);
        
      storageUrl = publicUrlData.publicUrl;
    } catch (storageErr) {
      console.error("[Storage] Note upload failed:", storageErr);
    }

    // Insert pending resource
    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "note",
      title: resourceTitle,
      fullText: text.trim(),
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
    console.error("[ingest/text] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
