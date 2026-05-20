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
    const { url, title, workspaceId, summary, tags } = body;

    if (!url || !workspaceId) {
      return Response.json({ error: "url and workspaceId are required." }, { status: 400 });
    }

    const resourceTitle = title?.trim() || "Web Resource";
    
    // If a manual summary is provided by the user, bypass scraping
    if (summary && summary.trim().length > 0) {
      const tagList = typeof tags === 'string' 
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(tags) ? tags : [];

      const [inserted] = await db.insert(resources).values({
        workspaceId,
        addedBy: user.id,
        type: "url",
        url,
        title: resourceTitle,
        fullText: summary, // Fallback fullText to the summary
        summary: summary,
        tags: tagList,
        status: "pending", // Let process route build vector embedding
      }).returning();

      await db.insert(activityLog).values({
        workspaceId,
        resourceId: inserted.id,
        userId: user.id,
        action: "added_resource",
      });

      return Response.json({ ok: true, resource: inserted });
    }

    let rawText = "";
    let isRestricted = false;
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!pageRes.ok) {
        isRestricted = true;
      } else {
        rawText = await pageRes.text();
        const lowerText = rawText.toLowerCase();
        
        // Detect Cloudflare protection, Access Denied errors, CAPTCHAs, or javascript challenges
        if (
          lowerText.includes("cloudflare") ||
          lowerText.includes("access denied") ||
          lowerText.includes("403 forbidden") ||
          lowerText.includes("robot check") ||
          lowerText.includes("just a moment") ||
          lowerText.includes("enable javascript") ||
          lowerText.includes("security check") ||
          (rawText.length < 500 && (lowerText.includes("forbidden") || lowerText.includes("unauthorized") || lowerText.includes("captcha")))
        ) {
          isRestricted = true;
        }
      }
    } catch (e) {
      isRestricted = true;
    }

    if (isRestricted) {
      return Response.json({
        error: "This website has restrictions that prevent automated reading. Please provide a manual summary and tags below to add this resource.",
        requiresSummary: true
      }, { status: 422 });
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
