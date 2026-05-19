import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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

    const existing = await db.select().from(resources).where(eq(resources.id, id));
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resource = existing[0];

    // If it has a Supabase Storage link, extract the file name and delete it from the bucket
    const metadata = resource.metadata as any;
    if (metadata?.storageUrl) {
      // The public URL looks like: https://[projectId].supabase.co/storage/v1/object/public/workspace-files/[workspaceId]/[filename]
      // We need to extract "[workspaceId]/[filename]"
      const urlParts = metadata.storageUrl.split('/workspace-files/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from('workspace-files').remove([filePath]);
      }
    }

    // Delete from Postgres (Embeddings and Connections will cascade automatically)
    await db.delete(resources).where(eq(resources.id, id));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[delete] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
