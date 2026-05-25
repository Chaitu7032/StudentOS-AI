# StudentOS AI

**Your AI Teacher, Mentor, and Career Guide.**

A premium AI-native learning operating system for students — combining AI tutoring, coding mentorship, interview prep, and a futuristic knowledge workspace.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688) ![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                         │
│  Next.js App Router · TypeScript · Tailwind · Shadcn        │
│  Zustand · TanStack Query · Framer Motion · SSE Client      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT
┌──────────────────────────▼──────────────────────────────────┐
│              Render / Railway (Backend)                      │
│  FastAPI · Async SQLAlchemy · JWT · Rate Limiting           │
│  Gemini 2.5 Flash Streaming · Mode-based Prompts            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Supabase PostgreSQL + pgvector                  │
│  Users · Chats · Messages · (Phase 2: Documents/RAG)        │
└─────────────────────────────────────────────────────────────┘
```

### Design decisions

| Choice | Reason |
|--------|--------|
| Monorepo (`frontend` + `backend`) | Simple deploy, clear separation, portfolio-friendly |
| Single AI model (Gemini Flash) | Free-tier friendly, no orchestration overhead |
| JWT auth (not Supabase Auth yet) | Lightweight MVP; OAuth fields ready for Phase 2 |
| SSE streaming | Real-time UX without WebSocket infrastructure |
| pgvector in schema | Phase 2 RAG ready without migration rework |

---

## Project structure

```
Student OS1/
├── frontend/                 # Next.js 16 App Router
│   ├── src/
│   │   ├── app/              # Routes (landing, auth, dashboard, chat)
│   │   ├── components/     # UI, chat, layout
│   │   ├── lib/              # API client
│   │   ├── stores/           # Zustand (auth, chat mode)
│   │   └── types/
│   └── .env.example
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/routes/       # auth, chat, knowledge, health
│   │   ├── services/         # gemini, rag, embeddings, chunking
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic validation
│   │   ├── services/         # Gemini, prompts, auth
│   │   └── security/         # JWT
│   └── .env.example
├── supabase/
│   └── schema.sql            # PostgreSQL + pgvector schema
└── README.md
```

---

## Phase 1 features (implemented)

- **AI Chat** — Streaming SSE, markdown, syntax highlighting, copy buttons, typing indicator
- **Learning Modes** — Beginner, Revision, Interview, Deep Dive, Exam Prep
- **Authentication** — Signup/login, JWT, protected routes, session persistence
- **Dashboard** — Stats placeholders, quick actions, recent chats
- **Premium UI** — Glassmorphism, gradients, dark/light mode, Framer Motion, responsive layout

## Phase 2 features (implemented) — RAG Knowledge Workspace

- **Document upload** — PDF, TXT, Markdown (max 5MB) + paste notes
- **Embeddings** — `sentence-transformers` (all-MiniLM-L6-v2, 384-dim) stored in **pgvector**
- **Chunking** — LangChain `RecursiveCharacterTextSplitter`
- **Semantic search** — Cosine similarity via pgvector
- **Contextual AI chat** — Toggle “Use my knowledge base” with **citation-style** answers `[1]`, `[2]`
- **Knowledge UI** — `/knowledge` workspace with library, stats, delete documents

## Phase 3 features (implemented) — Visual Learning

- **Mermaid in chat** — ` ```mermaid ` blocks render as interactive diagrams (dark/light, expandable)
- **Visual AI mode** — Prompts Gemini to produce flowcharts, sequence diagrams, and mindmaps
- **Diagram gallery** — Curated templates (DSA, architecture, auth, RAG pipeline)
- **DSA Lab** — Step-through bubble sort & binary search with Framer Motion bar animations
- **Concept maps** — Expandable OS, DSA, ML, and HTTP topic maps
- **`/visual` hub** — Central page for all visual learning tools

---

## Quick start (local)

### Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase project (or local PostgreSQL)
- [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### 1. Database (Supabase)

1. Create a free [Supabase](https://supabase.com) project
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy the connection string (Settings → Database → URI)
4. Convert to async format: `postgresql+asyncpg://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: DATABASE_URL, SECRET_KEY, GEMINI_API_KEY
python run.py
```

API runs at `http://localhost:8000` — docs at `/docs`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

App runs at `http://localhost:3000`

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` Supabase connection |
| `SECRET_KEY` | Long random string for JWT signing |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Default: `gemini-2.5-flash` |
| `CORS_ORIGINS` | `http://localhost:3000` (+ production URL) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL |

---

## Deployment (free tier)

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Connect repo, set `NEXT_PUBLIC_API_URL` |
| Backend | **Render** or **Railway** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Database | **Supabase** | Free PostgreSQL + pgvector |

### Render start command

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Security & performance

See **[SECURITY.md](./SECURITY.md)** for the full production checklist.

Highlights:

- Rate-limited auth, chat, uploads, and AI plan generation
- Security headers, CORS lockdown, production error sanitization
- Strict markdown sanitization + Mermaid `securityLevel: strict`
- DB connection pooling, GZip, fetch timeouts, lazy-loaded Mermaid

---

### RAG API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/knowledge/documents` | List user documents |
| POST | `/api/v1/knowledge/documents/upload` | Upload PDF/TXT/MD |
| POST | `/api/v1/knowledge/documents/text` | Paste notes as JSON |
| DELETE | `/api/v1/knowledge/documents/{id}` | Remove document + chunks |
| POST | `/api/v1/knowledge/search` | Semantic search |
| GET | `/api/v1/knowledge/stats` | Document/chunk counts |

Chat streaming accepts `use_knowledge: true` in the message body.

### Existing database migration (Phase 2)

If you already ran Phase 1 schema, add in Supabase SQL Editor:

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
```

## Phase 4 features (implemented) — Personalization

- **Progress overview** — Study streak, daily goals, topic counts, recommendations
- **Weak topic tracking** — Mastery scores, auto weak detection, practice sessions
- **AI study planner** — Gemini-generated weekly task plans from weak topics
- **Revision scheduling** — Calendar-style revision items with completion tracking
- **Learning memory** — Persistent notes about learning style and preferences
- **Auto activity tracking** — Chat messages log study time and update streaks
- **`/progress` hub** — Topics, Study Plan, Revision, Memory tabs

Run `supabase/schema-phase4.sql` if upgrading an existing database.

## Roadmap

| Phase | Features |
|-------|----------|
| **5 — Career** | Resume analysis, DSA roadmap, placement dashboard |

---

## Tech stack

**Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Zustand, TanStack Query, React Markdown, Mermaid.js

**Backend:** FastAPI, SQLAlchemy (async), Pydantic, Gemini 2.5 Flash

**Database:** Supabase PostgreSQL, pgvector

---

## License

MIT — Built for students, hackathons, and portfolio impact.
