import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { resources, activityLog } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, date, title, content } = body;

    if (!workspaceId || !date || !title || !content) {
      return Response.json({ error: "workspaceId, date, title, and content are required" }, { status: 400 });
    }

    // 1. Check if a report for this date already exists in the resources table
    // We filter by checking metadata->>'journalDate' = date
    const existingReports = await db.select()
      .from(resources)
      .where(eq(resources.workspaceId, workspaceId));

    const existingReport = existingReports.find(r => {
      const meta = r.metadata as any;
      return meta && meta.isJournalReport === true && meta.journalDate === date;
    });

    let savedResource;

    if (existingReport) {
      // Update existing report and put back to pending for re-indexing
      const [updated] = await db.update(resources)
        .set({
          title: title.trim(),
          fullText: content.trim(),
          status: "pending",
          updatedAt: new Date()
        })
        .where(eq(resources.id, existingReport.id))
        .returning();
      
      savedResource = updated;

      // Log activity
      await db.insert(activityLog).values({
        workspaceId,
        resourceId: existingReport.id,
        userId: user.id,
        action: "updated_journal_report",
      });
    } else {
      // Create new report resource
      const [inserted] = await db.insert(resources).values({
        workspaceId,
        addedBy: user.id,
        type: "note",
        title: title.trim(),
        fullText: content.trim(),
        status: "pending",
        metadata: { isJournalReport: true, journalDate: date },
        tags: ["Journal", "Daily-Report"],
      }).returning();

      savedResource = inserted;

      // Log activity
      await db.insert(activityLog).values({
        workspaceId,
        resourceId: inserted.id,
        userId: user.id,
        action: "published_journal_report",
      });
    }

    // 2. Trigger the background AI processing pipeline (non-blocking)
    // We trigger process API to generate new embeddings and semantic connections for the report
    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/process`, { method: "POST" }).catch(err => {
      console.error("[api/journal/publish] Failed to trigger /api/process:", err);
    });

    return Response.json({ ok: true, resource: savedResource });
  } catch (err: any) {
    console.error("[api/journal/publish] Error:", err);
    return Response.json({ error: err.message || "Failed to publish report" }, { status: 500 });
  }
}
