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
    const { title, text, workspaceId } = body;

    if (!text || text.trim().length < 5 || !workspaceId) {
      return Response.json({ error: "Text (min 5 chars) and workspaceId are required." }, { status: 400 });
    }

    const resourceTitle = title?.trim() || "Untitled Note";

    // Insert pending resource
    const [inserted] = await db.insert(resources).values({
      workspaceId,
      addedBy: user.id,
      type: "note",
      title: resourceTitle,
      fullText: text.trim(),
      status: "pending",
    }).returning();

    return Response.json({ ok: true, resource: inserted });
  } catch (err: any) {
    console.error("[ingest/text] Error:", err);
    return Response.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
