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
    const { url, title, workspaceId } = body;

    if (!url || !workspaceId) {
      return Response.json({ error: "url and workspaceId are required." }, { status: 400 });
    }

    const resourceTitle = title?.trim() || "Web Resource";
    
    let rawText = "";
    try {
      const pageRes = await fetch(url);
      rawText = await pageRes.text();
    } catch (e) {
      return Response.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    // Save a .url bookmark file to Supabase Storage
    let storageUrl: string | undefined;
    try {
      const bookmarkContent = `[InternetShortcut]\nURL=${url}`;
      const fileName = `${workspaceId}/${Date.now()}-${resourceTitle.replace(/[^a-zA-Z0-9.-]/g, '_')}.url`;
      const blob = new Blob([bookmarkContent], { type: "text/plain" });
      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(fileName, blob, { contentType: "text/plain", upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(fileName);
        
      storageUrl = publicUrlData.publicUrl;
    } catch (storageErr) {
      console.error("[Storage] Bookmark upload failed:", storageErr);
    }

    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "url",
      url,
      title: resourceTitle,
      fullText: rawText,
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
    console.error("[ingest/url] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
