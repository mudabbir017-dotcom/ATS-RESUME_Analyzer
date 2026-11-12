const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Cache embeddings so we don't request the same text twice
const embeddingCache = new Map();

async function getEmbedding(text) {
  if (!text) return [];

  const key = text.trim();

  if (embeddingCache.has(key)) {
    return embeddingCache.get(key);
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: key,
  });

  const embedding = response.embeddings[0].values;

  embeddingCache.set(key, embedding);

  return embedding;
}

// cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Old function (kept so existing code still works)
async function semanticScore(textA, textB) {
  const vecA = await getEmbedding(textA);
  const vecB = await getEmbedding(textB);

  return Math.round(
    Math.max(0, cosineSimilarity(vecA, vecB)) * 100
  );
}

// NEW: Uses an already computed embedding
async function semanticScoreWithEmbedding(text, existingEmbedding) {
  const vec = await getEmbedding(text);

  return Math.round(
    Math.max(0, cosineSimilarity(vec, existingEmbedding)) * 100
  );
}

module.exports = {
  getEmbedding,
  cosineSimilarity,
  semanticScore,
  semanticScoreWithEmbedding,
};