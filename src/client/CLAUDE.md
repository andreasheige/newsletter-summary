# Client

React frontend built with Vite. Pure React — no framework (no Next.js, no router).

## Dev

Vite dev server on port 5173, proxies `/api` to Express on 3000. Run with `npm run dev:client`.

## Architecture

- `main.tsx` — Entry point, renders `<App />`
- `App.tsx` — Top-level state (page, limit, sender, theme). Passes down to components.
- `api.ts` — Typed fetch wrappers for all API endpoints
- `hooks/` — Custom hooks for data fetching and theme
- `components/` — UI components (no state management library)
- `styles/globals.css` — All styles in one file, CSS custom properties for theming

## Dark theme

Uses `[data-theme="dark"]` on `<html>`. `useTheme` hook reads from `localStorage` and falls back to `prefers-color-scheme`. All colors use semantic CSS variables (`--bg`, `--text-primary`, `--border`, etc.).

## Conventions

- Types are imported from `../../shared/types` (shared with server)
- No `escapeHtml` needed — React auto-escapes JSX text
- Accordion open/close state is local to each `AccordionItem`
