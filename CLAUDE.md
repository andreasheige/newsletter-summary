# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A local macOS newsletter summarizer that reads emails from Mail.app via AppleScript, summarizes them with a local Ollama LLM, stores results in SQLite, and serves a React web UI with dark theme support.

## Stack

- **TypeScript 6.0 RC** (`"type": "module"`, ESM everywhere)
- **React 19** (pure, no framework) with **Vite 8** for frontend
- **Express 5** for backend API
- **better-sqlite3** for storage, **node-cron** for scheduling
- **Ollama** for local LLM summarization

## Commands

```bash
npm run dev            # Start both server + Vite client (concurrently)
npm run dev:server     # Backend only (tsx --watch)
npm run dev:client     # Frontend only (Vite HMR on :5173)
npm run build          # Production build (vite build + tsc)
npm start              # Production server (serves built client)
```

No tests or linter configured yet.

## Project Structure

```
src/
  server/     # Express backend (TypeScript, ESM)
  client/     # React frontend (Vite, TSX)
  shared/     # Types shared between server & client (API contracts)
```

Each directory has its own CLAUDE.md with specifics.

## Architecture

```
Mail.app → AppleScript (server/email.ts) → Worker (server/worker.ts) → Ollama (server/summarizer.ts) → SQLite (server/db.ts)
                                                                                                              ↓
                                                                     React UI (client/) ← Express API (server/index.ts)
```

In development: Vite on :5173 proxies `/api` to Express on :3000.

## Key Patterns

- **AppleScript dates are locale-sensitive** — User's macOS is Swedish. Never use `date "March 9, 2026"`. Always set year/month/day on `current date`.
- **Ollama may not be running** — `ensureOllamaRunning()` auto-starts server and pulls model before any LLM request.
- **LLM output is unreliable** — Small models produce malformed JSON. Keep prompts minimal (summary + tags only). Links come from HTML extraction, not the LLM.
- **ESM imports need `.js` extensions** — Even for `.ts` files when using NodeNext resolution (server-side).
- **`import.meta.dirname`** — Replaces `__dirname` (Node 24+).
- **Dark theme** — CSS custom properties with `[data-theme="dark"]` selector. `useTheme` hook persists to localStorage.

## Environment Variables

See `.env.example`. Key ones: `OLLAMA_MODEL` (default llama3.2), `NEWSLETTER_SENDERS` (comma-separated filter), `LOOKBACK_DAYS` (default 90), `MARK_AS_READ` (default false).

## API Endpoints

- `GET /api/newsletters?page=1&limit=25&sender=...` — Paginated list
- `GET /api/senders` — Distinct sender list
- `POST /api/check-now` — Trigger email fetch
- `POST /api/retry-failed` — Re-summarize broken entries
- `POST /api/refetch` — Delete entries missing links, re-fetch from Mail.app
- `POST /api/resummarize` — Re-summarize all entries
- `GET /api/status` — Health check
