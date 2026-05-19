import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql as drizzleSql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, workspaceId } = await request.json();

    if (!query || !workspaceId) {
      return NextResponse.json({ error: "Query and workspaceId are required" }, { status: 400 });
    }

    // 1. Semantic Search (Voyage AI)
    const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: [query],
        model: 'voyage-4-lite'
      })
    });
    
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;
    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for query");
    }
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    // 2. Hybrid Search using RRF (Reciprocal Rank Fusion)
    // We execute a raw SQL query that calculates both semantic rank and keyword rank
    const hybridQuery = drizzleSql`
      WITH semantic_search AS (
        SELECT 
          r.id,
          ROW_NUMBER() OVER (ORDER BY e.embedding <=> ${vectorStr}::vector) as semantic_rank
        FROM resources r
        JOIN embeddings e ON e.resource_id = r.id
        WHERE r.workspace_id = ${workspaceId} AND r.status = 'ready'
        ORDER BY e.embedding <=> ${vectorStr}::vector
        LIMIT 50
      ),
      keyword_search AS (
        SELECT 
          r.id,
          ROW_NUMBER() OVER (
            ORDER BY ts_rank(
              to_tsvector('english', r.title || ' ' || coalesce(r.summary, '')), 
              websearch_to_tsquery('english', ${query})
            ) DESC
          ) as keyword_rank
        FROM resources r
        WHERE r.workspace_id = ${workspaceId} AND r.status = 'ready'
          AND to_tsvector('english', r.title || ' ' || coalesce(r.summary, '')) @@ websearch_to_tsquery('english', ${query})
        LIMIT 50
      )
      SELECT 
        r.id,
        r.title,
        r.summary,
        r.url,
        r.type,
        r.created_at,
        COALESCE(1.0 / (60 + ss.semantic_rank), 0.0) + 
        COALESCE(1.0 / (60 + ks.keyword_rank), 0.0) as rrf_score
      FROM resources r
      LEFT JOIN semantic_search ss ON ss.id = r.id
      LEFT JOIN keyword_search ks ON ks.id = r.id
      WHERE (ss.id IS NOT NULL OR ks.id IS NOT NULL)
      ORDER BY rrf_score DESC
      LIMIT 10
    `;

    const result = await db.execute(hybridQuery);
    
    return NextResponse.json({ results: result.rows });
  } catch (err: any) {
    console.error("[search] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
