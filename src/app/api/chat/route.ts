import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { sql as drizzleSql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { logApiCall } from "@/lib/db/logger";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { messages, workspaceId } = await request.json();

    if (!messages || !messages.length || !workspaceId) {
      return new Response(JSON.stringify({ error: "Messages and workspaceId required" }), { status: 400 });
    }

    const latestMessage = messages[messages.length - 1].content;

    // 1. Perform Hybrid Search to get context
    const voyageStart = Date.now();
    let queryEmbedding: number[] | null = null;
    try {
      const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: [latestMessage],
          model: 'voyage-4-lite'
        })
      });
      
      const latencyMs = Date.now() - voyageStart;
      if (!embeddingResponse.ok) {
        const errText = await embeddingResponse.text();
        await logApiCall({
          workspaceId,
          service: "voyage",
          endpoint: "embeddings",
          status: "error",
          latencyMs,
          errorMessage: `HTTP ${embeddingResponse.status}: ${errText}`,
        });
        throw new Error(`Voyage API error: ${errText}`);
      }
      
      const embeddingData = await embeddingResponse.json();
      queryEmbedding = embeddingData.data?.[0]?.embedding;
      
      await logApiCall({
        workspaceId,
        service: "voyage",
        endpoint: "embeddings",
        status: "success",
        latencyMs,
      });
    } catch (e: any) {
      const latencyMs = Date.now() - voyageStart;
      await logApiCall({
        workspaceId,
        service: "voyage",
        endpoint: "embeddings",
        status: "error",
        latencyMs,
        errorMessage: e.message || String(e),
      });
      throw e;
    }

    const vectorStr = `[${queryEmbedding?.join(",")}]`;

    const hybridQuery = drizzleSql`
      WITH semantic_search AS (
        SELECT r.id, ROW_NUMBER() OVER (ORDER BY e.embedding <=> ${vectorStr}::vector) as semantic_rank
        FROM resources r
        JOIN embeddings e ON e.resource_id = r.id
        WHERE r.workspace_id = ${workspaceId} AND r.status = 'ready'
        ORDER BY e.embedding <=> ${vectorStr}::vector LIMIT 20
      ),
      keyword_search AS (
        SELECT r.id, ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', r.title || ' ' || coalesce(r.summary, '')), websearch_to_tsquery('english', ${latestMessage})) DESC) as keyword_rank
        FROM resources r
        WHERE r.workspace_id = ${workspaceId} AND r.status = 'ready'
          AND to_tsvector('english', r.title || ' ' || coalesce(r.summary, '')) @@ websearch_to_tsquery('english', ${latestMessage}) LIMIT 20
      )
      SELECT r.id, r.title, r.summary, r.url, r.type,
             COALESCE(1.0 / (60 + ss.semantic_rank), 0.0) + COALESCE(1.0 / (60 + ks.keyword_rank), 0.0) as rrf_score
      FROM resources r
      LEFT JOIN semantic_search ss ON ss.id = r.id
      LEFT JOIN keyword_search ks ON ks.id = r.id
      WHERE (ss.id IS NOT NULL OR ks.id IS NOT NULL)
      ORDER BY rrf_score DESC LIMIT 5
    `;

    const result = await db.execute(hybridQuery);
    const contextResources = result.rows as any[];

    // 2. Construct RAG Context
    let contextText = "No direct resources found for this context, answer based on general knowledge if appropriate.";
    let citationsMeta: any[] = [];

    if (contextResources.length > 0) {
      contextText = contextResources.map((r, index) => {
        citationsMeta.push({ id: r.id, title: r.title, url: r.url, type: r.type, index: index + 1 });
        return `[${index + 1}] Title: ${r.title}\nSummary: ${r.summary}`;
      }).join("\n\n");
    }

    const systemPrompt = `You are a helpful research assistant. Answer the user's question using ONLY the provided context resources.
If you use information from a resource, you MUST cite it using the bracketed number corresponding to the source, e.g., [1] or [3].
If the context does not contain the answer, say "I don't have enough information in the workspace to answer this."

CONTEXT RESOURCES:
${contextText}`;

    // 3. Stream Response
    const geminiStart = Date.now();
    let responseStream;
    try {
      responseStream = await genai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        ]
      });
      const latencyMs = Date.now() - geminiStart;
      await logApiCall({
        workspaceId,
        service: "gemini",
        endpoint: "generateContentStream",
        status: "success",
        latencyMs,
      });
    } catch (e: any) {
      const latencyMs = Date.now() - geminiStart;
      await logApiCall({
        workspaceId,
        service: "gemini",
        endpoint: "generateContentStream",
        status: "error",
        latencyMs,
        errorMessage: e.message || String(e),
      });
      throw e;
    }

    const encoder = new TextEncoder();
    
    // We send the metadata as the very first chunk so the UI can build the citation links
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "meta", citations: citationsMeta }) + "\n\n"));
        
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: "chunk", text: chunk.text }) + "\n\n"));
            }
          }
        } catch (e) {
          console.error("Stream error", e);
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error("[chat] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
