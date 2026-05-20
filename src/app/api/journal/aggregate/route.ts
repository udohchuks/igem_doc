import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { journalContributions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { logApiCall } from "@/lib/db/logger";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, date } = body;
    if (!workspaceId || !date) {
      return Response.json({ error: "workspaceId and date are required" }, { status: 400 });
    }

    // Fetch all contributions for this day
    const contribs = await db.select()
      .from(journalContributions)
      .where(
        and(
          eq(journalContributions.workspaceId, workspaceId),
          eq(journalContributions.date, date)
        )
      );

    if (contribs.length === 0) {
      return Response.json({ error: "No contributions found for this day to aggregate." }, { status: 400 });
    }

    const compiledUpdates = contribs.map((c, idx) => {
      const timeStr = c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : "";
      return `Member: ${c.userName}\nTime: ${timeStr}\nFile attached: ${c.fileName || "None"}\nUpdate:\n${c.content}\n----------------------------------------`;
    }).join("\n\n");

    const prompt = `You are a professional technical project manager for an iGEM (synthetic biology) research team. 
Given the following individual contributions from team members for the date [${date}], synthesize/combine them into a single cohesive, structured daily progress report.

The output report should be in markdown, organized with clear headers (such as "Key Achievements", "Work in Progress", and "Next Steps / Blockers"), and have a scientific yet readable tone.

Also, generate an appropriate, concise, and summary title for the report (maximum 8 words) that captures the main theme of what was accomplished (e.g., "Designing the Synthase Pathway").

Respond ONLY with a valid JSON object containing exactly two keys:
- "title": The generated title.
- "content": The markdown progress report.

Do not include any other text, explanation, or markdown formatting outside the JSON object itself.

Contributions:
"""
${compiledUpdates}
"""`;

    const geminiStart = Date.now();
    let response;
    try {
      response = await genai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      const latencyMs = Date.now() - geminiStart;
      await logApiCall({
        workspaceId,
        service: "gemini",
        endpoint: "journalAggregate",
        status: "success",
        latencyMs,
      });
    } catch (e: any) {
      const latencyMs = Date.now() - geminiStart;
      await logApiCall({
        workspaceId,
        service: "gemini",
        endpoint: "journalAggregate",
        status: "error",
        latencyMs,
        errorMessage: e.message || String(e),
      });
      throw e;
    }

    const raw = response.text || "{}";
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(jsonStr);

    return Response.json({
      ok: true,
      title: parsed.title || `Team Journal - ${date}`,
      content: parsed.content || "No report generated."
    });
  } catch (err: any) {
    console.error("[api/journal/aggregate] Error:", err);
    return Response.json({ error: err.message || "Failed to generate aggregation" }, { status: 500 });
  }
}
