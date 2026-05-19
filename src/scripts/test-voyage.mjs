/**
 * Quick test: calls the Voyage AI REST API with voyage-3-large
 * and prints the embedding dimensions and first 5 values.
 *
 * Run with:
 *   node --env-file=.env.local src/scripts/test-voyage.mjs
 */

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

if (!VOYAGE_API_KEY) {
  console.error("❌ VOYAGE_API_KEY is not set. Check your .env.local file.");
  process.exit(1);
}

const MODEL = "voyage-3-lite"; // Cost-optimised model — same 32K context, lower price
const TEST_TEXT =
  "CRISPR-Cas9 is a powerful gene-editing technology derived from a natural bacterial immune defense mechanism.";

console.log(`🧪 Testing Voyage AI — model: ${MODEL}`);
console.log(`📝 Input text: "${TEST_TEXT}"\n`);

const response = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${VOYAGE_API_KEY}`,
  },
  body: JSON.stringify({ input: TEST_TEXT, model: MODEL }),
});

if (!response.ok) {
  const err = await response.text();
  console.error(`❌ API error ${response.status}:`, err);
  process.exit(1);
}

const json = await response.json();
const vector = json.data?.[0]?.embedding;

if (!vector) {
  console.error("❌ No embedding returned.");
  process.exit(1);
}

console.log(`✅ Success!`);
console.log(`📐 Model returned: ${json.model}`);
console.log(`📊 Embedding dimensions: ${vector.length}`);
console.log(`🔢 First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(6)).join(", ")}]`);
console.log(`🪙 Tokens used: ${json.usage?.total_tokens ?? "N/A"}`);
