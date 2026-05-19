import { createClient } from 'supabase'
import postgres from 'postgres'
import { Readability } from 'npm:@mozilla/readability'
import { DOMParser } from 'npm:linkedom'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
const voyageApiKey = Deno.env.get('VOYAGE_API_KEY')!
const databaseUrl = Deno.env.get('DATABASE_URL')!

const sql = postgres(databaseUrl, { ssl: 'require' })

async function summarizeAndTag(text: string) {
  const prompt = `You are an AI assistant for a scientific knowledge management system.
Given the following resource text, return a JSON object with exactly two keys:
- "summary": A 2-3 sentence plain-language summary of the content.
- "tags": An array of 3-6 concise topic tags.
Respond ONLY with valid JSON. No markdown, no explanation.

Resource text:
"""
${text.slice(0, 8000)}
"""`

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      summary: parsed.summary ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : []
    }
  } catch {
    return { summary: raw.slice(0, 300), tags: [] }
  }
}

async function embedText(text: string) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${voyageApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: [text.slice(0, 24000)],
      model: 'voyage-4-lite'
    })
  })
  
  const data = await res.json()
  return data.data[0].embedding
}

function extractHtmlText(html: string, url?: string) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const reader = new Readability(doc)
    const article = reader.parse()
    return article?.textContent || html.replace(/<[^>]*>?/gm, '')
  } catch (e) {
    return html.replace(/<[^>]*>?/gm, '')
  }
}

Deno.serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (!record || record.status !== 'pending' || !record.full_text) {
    return new Response(JSON.stringify({ ok: true, message: 'Ignored' }), { headers: { 'Content-Type': 'application/json' } })
  }

  try {
    // If it's a URL, the full_text currently contains raw HTML
    let textToProcess = record.full_text
    if (record.type === 'url') {
      textToProcess = extractHtmlText(record.full_text, record.url)
    }

    const { summary, tags } = await summarizeAndTag(textToProcess)
    const embedding = await embedText(`${record.title}\n\n${summary}`)

    const vectorStr = `[${embedding.join(",")}]`

    // 1. Update resource
    await sql`
      UPDATE resources 
      SET summary = ${summary}, tags = ${tags}, status = 'ready' 
      WHERE id = ${record.id}
    `

    // 2. Insert embedding
    await sql`
      INSERT INTO embeddings (resource_id, embedding)
      VALUES (${record.id}, ${vectorStr}::vector)
    `

    // 3. Auto-connections via cosine similarity > 0.75
    const similar = await sql`
      SELECT e.resource_id, 1 - (e.embedding <=> ${vectorStr}::vector) AS similarity
      FROM embeddings e
      JOIN resources r ON r.id = e.resource_id
      WHERE e.resource_id != ${record.id} 
        AND r.workspace_id = ${record.workspace_id}
        AND 1 - (e.embedding <=> ${vectorStr}::vector) > 0.75
    `

    for (const sim of similar) {
      await sql`
        INSERT INTO connections (source_id, target_id, type)
        VALUES (${record.id}, ${sim.resource_id}, 'auto')
      `
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('Ingest error:', err)
    await sql`UPDATE resources SET status = 'error' WHERE id = ${record.id}`
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
