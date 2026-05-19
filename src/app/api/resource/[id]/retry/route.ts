import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // We don't check membership anymore since it's an internal tool, but we can verify the resource exists
    const existing = await db.select().from(resources).where(eq(resources.id, id));
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.update(resources)
      .set({ status: "pending" })
      .where(eq(resources.id, id));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[retry] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
