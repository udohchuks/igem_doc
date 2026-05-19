import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
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

    // Insert pending resource. We let the Webhook/Edge Function extract the HTML via readability.
    // However, the Edge Function expects `full_text`.
    // Wait, the edge function needs to fetch the URL if full_text is empty, but we can do simple HTML fetch here.
    
    let rawText = "";
    try {
      const pageRes = await fetch(url);
      rawText = await pageRes.text();
    } catch (e) {
      return Response.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "url",
      url,
      title: resourceTitle,
      fullText: rawText, // we dump the raw HTML here, the edge function can use Readability or Gemini can handle it.
      status: "pending",
    }).returning();

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/url] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
