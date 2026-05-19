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

    // Save a .url bookmark file to Google Drive
    let driveUrl: string | undefined;
    try {
      const bookmarkContent = `[InternetShortcut]\nURL=${url}`;
      const buffer = Buffer.from(bookmarkContent);
      const driveRes = await uploadDocumentToWorkspace(
        `${workspaceId}/${resourceTitle}.url`,
        "application/octet-stream",
        buffer,
        SHARED_FOLDER_ID!
      );
      driveUrl = driveRes.webViewLink || undefined;
    } catch (driveErr) {
      console.error("[Drive] Bookmark upload failed:", driveErr);
    }

    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "url",
      url,
      title: resourceTitle,
      fullText: rawText,
      status: "pending",
      metadata: driveUrl ? { driveUrl } : undefined,
    }).returning();

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/url] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
