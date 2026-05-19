import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { journalContributions, resources, activityLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require("pdf-parse");
  const data = await pdf(buffer);
  return data.text;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return Response.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all raw contributions in workspace
    const contribs = await db.select()
      .from(journalContributions)
      .where(eq(journalContributions.workspaceId, workspaceId))
      .orderBy(desc(journalContributions.createdAt));

    // 2. Fetch all published reports from resources (metadata has isJournalReport = true)
    const reports = await db.select()
      .from(resources)
      .where(
        and(
          eq(resources.workspaceId, workspaceId),
          eq(resources.status, "ready")
        )
      )
      .orderBy(desc(resources.createdAt));

    // Filter reports client-side for metadata.isJournalReport
    const journalReports = reports.filter(r => {
      const meta = r.metadata as any;
      return meta && meta.isJournalReport === true;
    });

    return Response.json({ 
      ok: true, 
      contributions: contribs,
      reports: journalReports 
    });
  } catch (err: any) {
    console.error("[api/journal] GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Team Member";

    // Handle form-data (for file upload + metadata) or JSON
    const contentType = request.headers.get("content-type") || "";
    
    let workspaceId = "";
    let date = "";
    let content = "";
    let fileName: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      workspaceId = formData.get("workspaceId") as string;
      date = formData.get("date") as string;
      const contentField = formData.get("content") as string | null;
      const file = formData.get("file") as File | null;

      if (!workspaceId || !date) {
        return Response.json({ error: "workspaceId and date are required" }, { status: 400 });
      }

      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
          content = await extractTextFromPdf(buffer);
        } else {
          content = buffer.toString("utf-8");
        }
      } else if (contentField) {
        content = contentField.trim();
      } else {
        return Response.json({ error: "content or file is required" }, { status: 400 });
      }
    } else {
      const body = await request.json();
      workspaceId = body.workspaceId;
      date = body.date;
      content = body.content;
      fileName = body.fileName || null;

      if (!workspaceId || !date || !content) {
        return Response.json({ error: "workspaceId, date, and content are required" }, { status: 400 });
      }
    }

    if (content.trim().length < 5) {
      return Response.json({ error: "Contribution must be at least 5 characters long." }, { status: 400 });
    }

    // Insert journal contribution
    const [inserted] = await db.insert(journalContributions).values({
      workspaceId,
      userId: user.id,
      userName,
      content: content.trim(),
      date,
      fileName,
    }).returning();

    // Log activity
    await db.insert(activityLog).values({
      workspaceId,
      userId: user.id,
      action: "added_journal_contribution",
    });

    return Response.json({ ok: true, contribution: inserted });
  } catch (err: any) {
    console.error("[api/journal] POST error:", err);
    return Response.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return Response.json({ error: "id and content are required" }, { status: 400 });
    }

    if (content.trim().length < 5) {
      return Response.json({ error: "Contribution must be at least 5 characters long." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve contribution to check ownership
    const [contrib] = await db.select()
      .from(journalContributions)
      .where(eq(journalContributions.id, id))
      .limit(1);

    if (!contrib) {
      return Response.json({ error: "Contribution not found" }, { status: 404 });
    }

    if (contrib.userId !== user.id) {
      return Response.json({ error: "You can only edit your own contributions" }, { status: 403 });
    }

    const [updated] = await db.update(journalContributions)
      .set({ content: content.trim() })
      .where(eq(journalContributions.id, id))
      .returning();

    return Response.json({ ok: true, contribution: updated });
  } catch (err: any) {
    console.error("[api/journal] PATCH error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve contribution to check ownership
    const [contrib] = await db.select()
      .from(journalContributions)
      .where(eq(journalContributions.id, id))
      .limit(1);

    if (!contrib) {
      return Response.json({ error: "Contribution not found" }, { status: 404 });
    }

    if (contrib.userId !== user.id) {
      return Response.json({ error: "You can only delete your own contributions" }, { status: 403 });
    }

    await db.delete(journalContributions)
      .where(eq(journalContributions.id, id));

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("[api/journal] DELETE error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
