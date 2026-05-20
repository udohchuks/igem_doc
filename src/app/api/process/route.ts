import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { resources, embeddings, connections } from "@/lib/db/schema";
import { eq, and, sql as drizzleSql, ne } from "drizzle-orm";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";

// Ensure this route runs optimally without timeouts if possible.
export const maxDuration = 60; // 1 minute max duration (Vercel limit for hobby is 10s or 60s depending on settings)
export const dynamic = "force-dynamic";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function summarizeAndTag(text: string) {
  const prompt = `You are an AI assistant for a scientific knowledge management system.
Given the following resource text, return a JSON object with exactly two keys:
- "summary": A 2-3 sentence plain-language summary of the content.
- "tags": An array of 3-6 concise topic tags.
Respond ONLY with valid JSON. No markdown, no explanation.

Resource text:
"""
${text.slice(0, 15000)}
"""`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    
    const raw = response.text || "{}";
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : []
    };
  } catch (err) {
    console.error("Gemini processing error:", err);
    return { summary: text.slice(0, 300) + "...", tags: [] };
  }
}

async function embedText(text: string) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: [text.slice(0, 24000)], // Voyage-4-lite context limit is around 32k tokens
      model: 'voyage-4-lite'
    })
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error("Voyage AI error:", err);
    return null;
  }
  
  const data = await res.json();
  return data.data?.[0]?.embedding;
}

export async function POST(request: NextRequest) {
  try {
    // We can allow this to be triggered asynchronously without auth, 
    // or we can secure it with a secret. For now, it's an internal processing trigger.
    
    // Find all 'pending' resources
    const pendingResources = await db.select().from(resources).where(eq(resources.status, "pending")).limit(5);

    if (pendingResources.length === 0) {
      return NextResponse.json({ ok: true, message: "No pending resources" });
    }

    const processedIds = [];

    for (const record of pendingResources) {
      try {
        console.log(`Processing resource: ${record.id} (${record.title})`);
        
        let textToProcess = record.fullText || "";
        
        // If it's a URL, the fullText might contain raw HTML. Let's clean it up using Cheerio.
        if (record.type === "url" && textToProcess.includes("<html")) {
          const $ = cheerio.load(textToProcess);
          textToProcess = $("body").text().replace(/\s+/g, " ").trim();
        }

        if (!textToProcess) {
          throw new Error("No text to process");
        }

        // 1. Summarize and Tag (only if not already provided)
        let summary = record.summary;
        let tags = record.tags;

        if (!summary || summary.trim().length === 0) {
          const result = await summarizeAndTag(textToProcess);
          summary = result.summary;
          tags = result.tags;
        }
        
        // 2. Embed
        const embeddingData = await embedText(`${record.title}\n\n${summary}\n\n${textToProcess.slice(0, 2000)}`);
        
        if (!embeddingData) {
          throw new Error("Failed to generate embedding");
        }

        // We format the array to a pgvector string format: [1.0, 2.0, ...]
        const vectorStr = `[${embeddingData.join(",")}]`;

        // 3. Save updates to DB
        await db.transaction(async (tx) => {
          // Update resource status
          await tx.update(resources)
            .set({ 
              summary, 
              tags, 
              status: "ready" 
            })
            .where(eq(resources.id, record.id));

          // Insert embedding
          // drizzle-orm supports raw sql for vector operations
          await tx.execute(drizzleSql`
            INSERT INTO embeddings (resource_id, embedding)
            VALUES (${record.id}, ${vectorStr}::vector)
            ON CONFLICT (resource_id) DO UPDATE SET embedding = EXCLUDED.embedding
          `);

          // 4. Auto-connections via cosine similarity > 0.75
          // We can find similar resources and link them.
          const similar = await tx.execute(drizzleSql`
            SELECT e.resource_id, 1 - (e.embedding <=> ${vectorStr}::vector) AS similarity
            FROM embeddings e
            JOIN resources r ON r.id = e.resource_id
            WHERE e.resource_id != ${record.id} 
              AND r.workspace_id = ${record.workspaceId}
              AND 1 - (e.embedding <=> ${vectorStr}::vector) > 0.75
          `);

          for (const row of similar.rows as any[]) {
            await tx.insert(connections).values({
              sourceId: record.id,
              targetId: row.resource_id,
              type: "auto"
            });
          }
        });

        processedIds.push(record.id);
      } catch (err) {
        console.error(`Failed processing resource ${record.id}:`, err);
        await db.update(resources).set({ status: "error" }).where(eq(resources.id, record.id));
      }
    }

    return NextResponse.json({ ok: true, processedCount: processedIds.length, processedIds });
  } catch (err: any) {
    console.error("[process] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
