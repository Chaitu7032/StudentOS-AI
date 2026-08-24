# StudentOS AI — Complete Project Summary

> **Your AI Teacher, Mentor, and Career Guide.**
> A premium AI-native learning operating system for students — combining AI tutoring, coding mentorship, interview prep, and a futuristic knowledge workspace.

---

## Table of Contents

1. [What Is StudentOS AI?](#1-what-is-studentos-ai)
2. [All Features — Complete List](#2-all-features--complete-list)
3. [Architecture & How It Works](#3-architecture--how-it-works)
4. [Detailed User Workflow](#4-detailed-user-workflow)
5. [Tech Stack](#5-tech-stack)
6. [Security & Performance](#6-security--performance)

---

## 1. What Is StudentOS AI?

StudentOS AI is a **full-stack, AI-powered learning platform** built like an operating system for students. It replaces a dozen scattered tools (Google Docs, YouTube tutors, chatGPT, Notion, Anki, Trello, draw.io) with a single integrated experience.

It is NOT just a chatbot. It is a **complete learning ecosystem** with:

- An AI tutor that adapts to your **learning mode**
- A **personal knowledge base** you can upload documents into (RAG)
- **Visual learning tools** (diagrams, animations, concept maps)
- **Personalized progress tracking** (streaks, weak topics, study plans)
- **Interview prep** and **exam preparation** modes

---

## 2. All Features — Complete List

### Phase 1 — Core AI Chat & Authentication

| Feature | Description |
|---------|-------------|
| **AI Chat** | Streaming real-time chat with Gemini 2.5 Flash. Messages appear word-by-word via SSE (Server-Sent Events) |
| **Markdown Rendering** | Full markdown support with syntax-highlighted code blocks, copy buttons |
| **5 Learning Modes** | **Beginner** (simplified explanations), **Revision** (concise summaries), **Interview** (Q&A style), **Deep Dive** (expert-level), **Exam Prep** (test-oriented) |
| **Authentication** | Signup / Login with JWT tokens, password hashing (bcrypt), protected routes, session persistence via Zustand |
| **Dashboard** | Stats overview, quick action buttons, recent chats list |
| **Premium UI** | Glassmorphism design, gradients, dark/light mode toggle, Framer Motion animations, fully responsive |

### Phase 2 — RAG Knowledge Workspace

| Feature | Description |
|---------|-------------|
| **Document Upload** | Upload PDF, TXT, Markdown files (up to 5MB). Also supports pasting notes directly |
| **AI Embeddings** | Documents are processed through `sentence-transformers` (all-MiniLM-L6-v2, 384-dimensional vectors) |
| **Intelligent Chunking** | LangChain `RecursiveCharacterTextSplitter` splits documents into semantic chunks |
| **pgvector Storage** | Embeddings stored in PostgreSQL with pgvector extension for fast similarity search |
| **Semantic Search** | Cosine similarity search across your entire knowledge base |
| **Contextual AI Answers** | Toggle "Use my knowledge base" in chat — AI answers with **citations** like `[1]`, `[2]` pointing to source documents |
| **Knowledge Library UI** | `/knowledge` workspace showing all your documents, their stats, and the ability to delete them |

### Phase 3 — Visual Learning

| Feature | Description |
|---------|-------------|
| **Mermaid Diagrams in Chat** | `\`\`\`mermaid` code blocks render as interactive diagrams directly inside chat. Supports dark/light mode, expandable |
| **Visual AI Mode** | A dedicated prompt mode that instructs Gemini to produce flowcharts, sequence diagrams, mind maps automatically |
| **Diagram Gallery** | Curated template library with pre-made diagrams: DSA algorithms, system architecture, OAuth flow, RAG pipeline, etc. |
| **DSA Lab** | Interactive step-through animations of Bubble Sort and Binary Search using Framer Motion bar animations |
| **Concept Maps** | Expandable topic maps for Operating Systems, Data Structures & Algorithms, Machine Learning, HTTP/Networking |
| **Visual Hub** | Central `/visual` page with all visual tools in one place |

### Phase 4 — Personalization & Progress Tracking

| Feature | Description |
|---------|-------------|
| **Progress Overview** | Study streak counter, daily goal tracking, topic completion counts, AI-generated recommendations |
| **Weak Topic Tracking** | Mastery scores (0–100%) per topic, automatic weak topic detection based on chat history, one-click practice sessions |
| **AI Study Planner** | Gemini generates a weekly task plan based on your detected weak topics — scheduled day-by-day |
| **Revision Scheduling** | Calendar-style revision items with completion checkboxes. Review before exams |
| **Learning Memory** | Persistent notes about your learning style, preferences, and past feedback — remembered across sessions |
| **Auto Activity Tracking** | Every chat message automatically logs study time and updates your streak. No manual logging needed |
| **Progress Hub** | `/progress` page with 4 tabs: Topics, Study Plan, Revision, Memory |

### Phase 5 — Career (Planned / Roadmap)

| Feature | Status |
|---------|--------|
| Resume Analysis | Planned |
| DSA Roadmap | Planned |
| Placement Dashboard | Planned |

---

## 3. Architecture & How It Works

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                          │
│  Next.js 16 App Router · TypeScript · Tailwind · Shadcn      │
│  Zustand (state) · TanStack Query (caching) · Framer Motion  │
│  SSE Client (streaming) · Zustand persist (JWT)              │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS + JWT (Bearer token)
┌──────────────────────────▼───────────────────────────────────┐
│              Render / Railway (Backend)                        │
│  FastAPI · Async SQLAlchemy · JWT · Rate Limiting             │
│  Gemini 2.5 Flash (streaming) · Mode-based Prompts            │
│  sentence-transformers (embeddings) · LangChain (chunking)    │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              Supabase PostgreSQL + pgvector                    │
│  Tables: users, chats, messages, documents, chunks,           │
│  progress_topics, study_plans, revision_items, learning_memory│
└──────────────────────────────────────────────────────────────┘
```

### How Data Flows (Step by Step)

#### A) Chat Flow
1. User types a message in the chat input
2. Frontend sends POST to `/api/v1/chat/stream` with JWT + message + mode + optional `use_knowledge: true`
3. Backend validates JWT, checks rate limit, applies mode-specific prompt
4. If `use_knowledge=true`, backend performs semantic search on user's documents, injects top chunks as context
5. Backend calls Gemini API with streaming enabled
6. Gemini response streams back as SSE (Server-Sent Events) — each chunk sent immediately to frontend
7. Frontend renders tokens as they arrive (real-time typing effect)
8. On completion, full message saved to database (messages table)
9. Study time logged to analytics (streak + daily stats updated)

#### B) Knowledge / RAG Flow
1. User uploads a PDF (or pastes notes) on the `/knowledge` page
2. Backend receives file, validates extension/size, saves to database (documents table)
3. Document is parsed:
   - PDF → text extraction via PyMuPDF or similar
   - TXT/MD → direct read
4. Text is split into chunks using LangChain `RecursiveCharacterTextSplitter` (chunk size ~500 chars with overlap)
5. Each chunk is converted to a 384-dimension vector via `sentence-transformers`
6. Chunks + vectors stored in `document_chunks` table with pgvector
7. During chat, when user toggles "Use my knowledge base", each query is embedded and searched against pgvector using cosine similarity
8. Top-K matching chunks are injected into the AI prompt with source citations

#### C) Progress & Personalization Flow
1. Every chat message logs activity — backend tracks per-user daily message counts
2. Study streak calculated based on consecutive days with activity
3. Weak topic detection: backend analyzes chat history topics with low mastery scores (<40%)
4. AI Study Planner: user clicks "Generate Plan" → backend sends weak topics to Gemini → Gemini returns 7-day task plan → saved to `study_plans` table
5. Revision scheduling: user creates revision items manually or from weak topics → displayed as calendar list
6. Learning Memory: user can save notes about learning preferences → injected into every future chat as system context

#### D) Visual Learning Flow
1. User can ask for a diagram in chat (e.g., "Explain binary search with a flowchart")
2. Backend's "Visual AI" mode prompt tells Gemini to output Mermaid syntax
3. Gemini returns mermaid code blocks in markdown
4. Frontend detects `\`\`\`mermaid` blocks, renders them as interactive SVG diagrams using Mermaid.js library
5. User can expand, zoom, and download diagrams
6. DSA Lab and Concept Maps are standalone interactive components using Framer Motion for animations

---

## 4. Detailed User Workflow

### First-Time User

#### Step 1: Sign Up
- User lands on **`/`** landing page with beautiful glassmorphism hero
- Clicks "Get Started" → navigates to **`/signup`**
- Enters email + password → backend hashes password via bcrypt → creates user in Supabase
- Returns JWT token → frontend stores in Zustand (localStorage) → redirects to **`/dashboard`**

#### Step 2: Dashboard Overview
- User sees:
  - Study streak (initial: 0 days)
  - "Start Learning" button
  - Quick actions: Ask AI, Upload Documents, Visual Learning
  - Recent chats (empty initially)
- Dashboard feels alive with Framer Motion entrance animations

#### Step 3: First Chat
- User clicks "Start Learning" → navigates to **`/chat`**
- Selects **learning mode** from dropdown: Beginner (default), Revision, Interview, Deep Dive, Exam Prep
- Types: "Explain what a linked list is"
- Frontend calls `/api/v1/chat/stream` with mode = "beginner"
- Backend selects the Beginner system prompt: *"Explain like I'm 5 — use analogies, avoid jargon..."*
- AI streams response back in real-time — user sees words appearing live
- Response includes a simple code example with syntax highlighting
- User can copy code blocks, continue the conversation

#### Step 4: Try Different Modes
- User switches to **Interview Mode**
- Asks same question → Gemini responds with a common interview question format + answer
- Switches to **Deep Dive** → gets technical explanation with time/space complexity
- Switches to **Exam Prep** → gets practice questions with answers

### Intermediate User (Day 2–7)

#### Step 5: Upload Knowledge Documents
- User navigates to **`/knowledge`**
- Clicks "Upload" → selects a PDF textbook chapter on Data Structures
- Backend processes: parses PDF → splits into chunks → generates embeddings → stores in pgvector
- User sees document in library with chunk count, upload date
- User also pastes their class notes via the "Paste Notes" button

#### Step 6: Chat with Knowledge Base
- User returns to **`/chat`**
- Toggles **"Use my knowledge base"** ON
- Asks: "What did my textbook say about tree traversals?"
- Backend: embeds query → searches pgvector for similar chunks from user's documents → finds top 3 matches
- Injects chunks into prompt with instruction: *"Answer using the following context. Cite sources as [1], [2]..."*
- AI responds with: *"According to your textbook[1], there are three main tree traversals..."* — citations link back to source material

#### Step 7: Visual Learning
- User visits **`/visual`** hub
- Browses Diagram Gallery → clicks on "Binary Search" template
- Sees pre-made Mermaid flowchart
- Opens **DSA Lab** → selects "Bubble Sort" → clicks "Step Through"
- Sees animated bars with Framer Motion — each step shows a pair of bars swapping
- User can control playback: Next, Previous, Auto-Play
- Back in chat, user types: "Draw me a sequence diagram of OAuth 2.0"
- Visual AI mode kicks in → Gemini returns mermaid code → rendered as interactive diagram

### Advanced User (Week 2+)

#### Step 8: Track Progress
- User visits **`/progress`** hub
- **Topics tab**: Sees mastery scores — "Linked Lists: 80%", "Trees: 45%", "Sorting: 90%"
- "Trees" is flagged as a **weak topic** (<50%) — button "Practice This Topic"
- User clicks "Practice" → automatically opens chat in Deep Dive mode with a prompt about trees
- **Study Plan tab**: Clicks "Generate AI Plan" → Gemini creates a 7-day plan: *Day 1: Binary Trees, Day 2: BST...*
- Each day has a checkbox — user marks completion
- **Revision tab**: User adds revision items: "Review BST deletion" scheduled for next week
- **Memory tab**: User writes: *"I learn best with visual examples and real-world analogies"* — this is saved and injected into all future chats

#### Step 9: Build Streak & Daily Goals
- User sees their **streak counter** in the dashboard — now at 12 days
- Daily goal: 30 minutes (tracked automatically from chat activity)
- Dashboard shows recommendations: *"You've been studying Trees — try Binary Search Trees next"*

#### Step 10: Interview Preparation
- User selects **Interview Mode** in chat
- Practices: "What is the difference between a process and a thread?"
- AI responds as an interviewer: first asks the question, then evaluates the answer, provides hints if needed
- User can do mock interview sessions with follow-up questions

### Power User (Ongoing)

#### Daily Routine:
1. Open dashboard → check streak (maintain motivation)
2. Review today's study plan items → check off completed
3. Quick revision session: ask AI to quiz on weak topics
4. Upload new lecture notes to knowledge base
5. Generate visual diagrams for complex topics
6. Track progress → see mastery scores improve over time

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 16 (App Router) | SSR, routing, API routes |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS + Shadcn UI | Utility-first + component library |
| **State Management** | Zustand | Lightweight global state (auth, chat mode) |
| **Server State** | TanStack Query | Caching, refetching, optimistic updates |
| **Animations** | Framer Motion | UI animations & DSA Lab |
| **Diagrams** | Mermaid.js | Render flowcharts, sequence diagrams |
| **Markdown** | react-markdown + rehype-sanitize | Render + sanitize AI output |
| **HTTP Client** | Fetch API with AbortSignal | Streaming SSE + timeouts |
| **Backend Framework** | FastAPI (Python) | Async, auto-docs, high performance |
| **ORM** | SQLAlchemy (async) | Database interaction |
| **Validation** | Pydantic | Request/response validation |
| **AI Model** | Gemini 2.5 Flash | All AI functionality (chat, plans, diagrams) |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Document vectorization |
| **Text Splitting** | LangChain RecursiveCharacterTextSplitter | Document chunking |
| **Database** | Supabase PostgreSQL | Primary data store |
| **Vector Search** | pgvector extension | Cosine similarity search |
| **Auth** | JWT (HS256) + bcrypt | Authentication |
| **Rate Limiting** | SlowAPI middleware | Abuse prevention |
| **Deployment** | Vercel (frontend) + Render/Railway (backend) | Hosting |

---

## 6. Security & Performance

### Security Highlights

| Area | Protection |
|------|-----------|
| **Passwords** | bcrypt hashing via passlib |
| **JWT** | HS256 with expiry, UUID validation, algorithm allowlist |
| **Rate Limiting** | 10 req/min on auth, per-IP; per-route limits on chat, upload, AI plan |
| **CORS** | Explicit origin allowlist from env |
| **Content Security** | Strict CSP headers, XSS sanitization on all AI output |
| **Markdown XSS** | rehype-sanitize schema — no script/iframe tags |
| **Mermaid** | `securityLevel: strict`, max chart length limit |
| **Upload Safety** | Extension allowlist, max file size (5MB), sanitized filenames |
| **SQL Injection** | Parameterized queries only (SQLAlchemy) |
| **Error Messages** | Generic in production — no stack traces to clients |

### Performance Highlights

| Area | Optimization |
|------|-------------|
| **Database** | Connection pooling (pool_size=5, max_overflow=10), pool health checks |
| **Streaming** | SSE with no buffering header for real-time UX |
| **Frontend** | Dynamic imports for Mermaid, 60s stale time on TanStack Query |
| **Compression** | GZip on backend responses > 1KB, Next.js compression enabled |
| **Code Splitting** | Mermaid loaded only when needed (lazy) |
| **Build** | Static pages where possible, AVIF/WebP images |

---

## Summary

**StudentOS AI** is a production-grade, full-stack AI learning platform with **4 completed phases** of features:

1. **AI Chat** with 5 learning modes + real-time streaming
2. **RAG Knowledge Base** — upload documents, semantic search, citation-based answers
3. **Visual Learning** — Mermaid diagrams, DSA animations, concept maps
4. **Personalization** — progress tracking, weak topic detection, AI study planner, revision scheduling

It is built with modern best practices: TypeScript + Next.js frontend, FastAPI async backend, PostgreSQL with pgvector, JWT auth, rate limiting, XSS protection, and a stunning glassmorphism UI. The entire system is designed to be **deployed on free-tier services** (Vercel + Render + Supabase), making it accessible for students and portfolio-ready for developers.

---

*Built with Next.js, FastAPI, Gemini 2.5 Flash, and Supabase — MIT Licensed*