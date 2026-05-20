import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { apiLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

    const { id: workspaceId } = await params;

    await db.delete(apiLogs).where(eq(apiLogs.workspaceId, workspaceId));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[clear-logs] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
