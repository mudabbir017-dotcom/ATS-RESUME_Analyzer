const axios = require("axios");
const {
  getEmbedding,
  semanticScore,
  semanticScoreWithEmbedding,
} = require("./embeddings");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// -----------------------------
// Groq Helper
// -----------------------------
async function callGemini(prompt) {
  const res = await axios.post(
    GROQ_URL,
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

// -----------------------------
// Parse JSON safely
// -----------------------------
function parseJSONResponse(raw) {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

// -----------------------------
// ATS Gap Analysis
// -----------------------------
async function analyzeGaps(resumeText, jobDescription) {
  const prompt = `You are an ATS (Applicant Tracking System) and resume reviewer.

Job description:
"""${jobDescription}"""

Candidate resume:
"""${resumeText}"""

Compare them and respond with ONLY valid JSON (no markdown):

{
  "missingSkills": [],
  "suggestions": []
}

Rules:

- missingSkills = important keywords absent from resume.
- suggestions = actionable improvements.
- Max 8 missing skills.
- Max 6 suggestions.`;

  const raw = await callGemini(prompt);

  return parseJSONResponse(raw);
}

// -----------------------------
// Rewrite Loop
// -----------------------------
async function rewriteBulletUntilGoodEnough(
  bullet,
  jobDescription,
  { threshold = 80, maxAttempts = 3 } = {}
) {

  // Embed JD ONCE
  const jdEmbedding = await getEmbedding(jobDescription);

  let currentText = bullet;

  let currentScore =
    await semanticScoreWithEmbedding(
      currentText,
      jdEmbedding
    );

  const initialScore = currentScore;

  const history = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {

    if (currentScore >= threshold) break;

    const prompt = `You are rewriting ONE resume bullet.

Job Description:

"""${jobDescription}"""

Current Bullet:

"""${currentText}"""

Rewrite it.

Rules:

- Keep facts truthful.
- Max 30 words.
- ATS friendly.
- Strong action verb.
- Preserve metrics.

Return ONLY JSON.

{
"rewritten_bullet":"",
"reasoning":""
}`;

    const raw = await callGemini(prompt);

    const parsed = parseJSONResponse(raw);

    currentText = parsed.rewritten_bullet;

    // Uses cached JD embedding
    currentScore =
      await semanticScoreWithEmbedding(
        currentText,
        jdEmbedding
      );

    history.push({
      attempt,
      text: currentText,
      score: currentScore,
      reasoning: parsed.reasoning,
    });
  }

  return {
    original: bullet,
    finalRewrite: currentText,
    initialScore,
    finalScore: currentScore,
    attempts: history.length,
    history,
  };
}

module.exports = {
  analyzeGaps,
  rewriteBulletUntilGoodEnough,
};