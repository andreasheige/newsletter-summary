# Server

Express backend running on port 3000. TypeScript with ESM (`import`/`export`).

## Key constraints

- **AppleScript dates must be locale-independent.** Never use `date "March 9, 2026"`. Always set year/month/day on `current date` (user's macOS is Swedish).
- **Ollama may not be running.** Always call `ensureOllamaRunning()` before LLM requests. It auto-starts the server and pulls the model.
- **LLM output is unreliable.** Keep prompts minimal (summary + tags only). Links come from HTML extraction in `utils.ts`, not the LLM. Always have JSON parse fallbacks.
- **`import.meta.dirname`** replaces `__dirname` (Node 24, ESM).
- **`.js` extensions** are required in import paths even for `.ts` files (NodeNext module resolution).

## Files

- `index.ts` — Express routes, cron, startup logic
- `worker.ts` — Email processing pipeline with mutex (`isRunning`)
- `email.ts` — Mail.app integration via `osascript`
- `summarizer.ts` — Ollama client with auto-start/pull
- `db.ts` — SQLite via better-sqlite3, typed prepared statements wrapped in functions
- `utils.ts` — HTML-to-text and link extraction
- `types.ts` — Server-internal types (Email, RawLink, NewsletterRow)
