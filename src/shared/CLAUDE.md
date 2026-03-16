# Shared

TypeScript types used by both server and client. Imported as `../shared/types` from either side.

Keep types here when they represent the API contract (request/response shapes). Server-internal types (DB rows, raw email data) belong in `src/server/types.ts`.
