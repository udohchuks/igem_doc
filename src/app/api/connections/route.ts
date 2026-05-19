import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { connections, resources, activityLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, targetId, type = "manual" } = body;

    if (!sourceId || !targetId) {
      return Response.json({ error: "sourceId and targetId are required" }, { status: 400 });
    }

    // 1. Fetch both resources to ensure they exist and belong to the same workspace
    const [sourceRes] = await db.select().from(resources).where(eq(resources.id, sourceId));
    const [targetRes] = await db.select().from(resources).where(eq(resources.id, targetId));

    if (!sourceRes || !targetRes) {
      return Response.json({ error: "Source or Target resource not found" }, { status: 404 });
    }

    if (sourceRes.workspaceId !== targetRes.workspaceId) {
      return Response.json({ error: "Resources must belong to the same workspace" }, { status: 400 });
    }

    // 2. Check if a connection already exists to avoid duplicates
    const existing = await db.select()
      .from(connections)
      .where(
        and(
          eq(connections.sourceId, sourceId),
          eq(connections.targetId, targetId)
        )
      );

    if (existing.length > 0) {
      return Response.json({ ok: true, message: "Connection already exists", connection: existing[0] });
    }

    // 3. Insert connection
    const [inserted] = await db.insert(connections).values({
      sourceId,
      targetId,
      type: type as any,
    }).returning();

    // 4. Log activity
    await db.insert(activityLog).values({
      workspaceId: sourceRes.workspaceId,
      userId: user.id,
      action: "added_connection",
      resourceId: sourceRes.id,
    });

    return Response.json({ ok: true, connection: inserted });
  } catch (err: any) {
    console.error("[api/connections] POST error:", err);
    return Response.json({ error: err.message || "Failed to create connection" }, { status: 500 });
  }
}
