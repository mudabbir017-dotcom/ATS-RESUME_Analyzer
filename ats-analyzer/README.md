# AI-Powered Resume ATS Analyzer

A full MERN app that scores a resume against a job description using
semantic (embeddings-based) matching, finds missing skills with an LLM,
and iteratively rewrites weak bullet points until they clear a match
threshold.

## Stack

- **Backend:** Node.js, Express, MongoDB + Mongoose, JWT auth, Multer, pdf-parse
- **AI:** Google Gemini — `text-embedding-004` for semantic scoring, `gemini-1.5-flash` for gap analysis + rewrites
- **Frontend:** React (Vite), React Router, Axios

One note on a deliberate substitution: the original plan mentioned
`pdfjs-dist` for PDF parsing. This build uses `pdf-parse` instead —
it's the more common choice for server-side text extraction in Node
(pdfjs-dist is really built for in-browser rendering and pulls in extra
canvas dependencies on the backend). Functionally it does the same
job: PDF buffer in, plain text out. Worth knowing this if it comes up
in an interview — it shows you made a deliberate library choice, not
just followed a tutorial blindly.

## How the pipeline works (matches the diagram)

1. **Auth** — register/login, password hashed with bcrypt, JWT issued and stored client-side.
2. **Upload & parse** — resume PDF uploaded via Multer (kept in memory, never written to disk), text extracted with `pdf-parse`.
3. **Semantic scoring** — resume text and job description are each turned into embedding vectors (`text-embedding-004`), then compared with cosine similarity to get a 0–100 match score. This is why "managed a team of 5 engineers" can match "team leadership" even though no words overlap.
4. **AI gap analysis** — Gemini reads both texts and returns missing skills + suggestions as structured JSON.
5. **Iterative rewrite loop** — the weakest-scoring bullet points (below 60%) get sent to Gemini to rewrite, re-scored with embeddings, and re-sent for another pass if still weak — up to 3 attempts per bullet, capped at 3 bullets per analysis to control API cost.
6. **Save & display** — the full report is saved to MongoDB (scoped to the logged-in user) and shown in a report modal; past reports are browsable on the History page.

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier is fine)
- A free Gemini API key from https://aistudio.google.com/app/apikey

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY in .env
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

Open the frontend URL, register an account, then go to the Analyze
page to upload a resume PDF and paste a job description.

## Project structure
```
backend/
  config/db.js              MongoDB connection
  models/                    User, Analysis (Mongoose schemas)
  middleware/                JWT auth guard, Multer upload config
  controllers/                register/login, the analyze pipeline
  routes/                     /api/auth, /api/analysis
  utils/
    pdfParser.js              PDF -> text
    embeddings.js              text -> vector, cosine similarity
    geminiService.js            gap analysis + iterative rewrite loop
    textUtils.js                splits resume into bullet lines

frontend/
  src/context/AuthContext.jsx   login/register/logout state, JWT storage
  src/pages/                    Login, Register, Dashboard, History
  src/components/                Navbar, ProtectedRoute, ReportModal
  src/api/axios.js                axios instance, attaches JWT header
```

## Talking points for interviews

- **"Why embeddings instead of keyword matching?"** Keyword/regex matching
  fails on synonyms and rephrasing. Embeddings map text to a "meaning
  space" so semantically similar phrases score as a match even with
  zero word overlap.
- **"What does the iterative loop actually do?"** It's a simple
  feedback loop, not true multi-step agentic planning: rewrite → score
  → check threshold → retry or stop. Framing it that precisely (rather
  than overselling it as "AI agents") reads as more credible, not less.
- **"Why cap it at 3 bullets / 3 attempts?"** Cost and latency control —
  every bullet rewrite is 1+ Gemini calls plus 2 embedding calls. Capping
  keeps a single analysis fast and cheap while still demonstrating the
  technique on the weakest content.
- **"How is the resume text isolated per user?"** Every Analysis document
  stores a `user` reference, and every query in the controller filters
  by `req.user._id` (set by the JWT middleware), so one user can never
  read another's reports.

## Things to add if you want to push it further
- Rate limiting / request queueing around the Gemini calls
- Caching embeddings for identical job descriptions
- Swap `pdf-parse` for OCR fallback (e.g. Tesseract) for scanned/image PDFs
