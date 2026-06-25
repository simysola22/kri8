# kri8

A production-ready idea management platform for content creators — capture, branch, schedule, and discover trending angles for your content ideas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind + shadcn/ui + Wouter routing
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Trend engine: `lib/trend-engine` (provider abstraction: mock default, YouTube skeleton)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` — users, ideas, friendships, messages
- API contract: `lib/api-spec/openapi.yaml` (source of truth; run codegen after changes)
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- Generated Zod schemas: `lib/api-zod/src/generated/api.ts`
- Trend engine: `lib/trend-engine/src/` — types, providers, analyzer, inspiration
- Server routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/kri8/src/pages/`
- Env example: `.env.example` (all vars documented)

## Architecture decisions

- **Provider abstraction for trends**: `TREND_PROVIDER=mock|youtube` env var; defaults to mock so the app works with zero config. Add `YOUTUBE_API_KEY` to switch to real data. OpenAI key enables AI-powered inspiration; falls back to templates without it.
- **Deployment-independent**: No Replit-specific services or env vars. Clerk, DB, and trends all configured via standard env vars. App works on any host.
- **api-zod only exports Zod schemas** (`export * from "./generated/api"` only — not `./generated/types`). The types directory conflicts with Orval's auto-generated param type names; TypeScript types are available from `@workspace/api-client-react` instead.
- **Friendships use a uniqueIndex** on `(requesterId, addresseeId)` to prevent duplicate requests. The addressee responds via PATCH `/social/friends/:requestId/respond`.
- **Calendar endpoint** queries ideas where `createdDate`, `usedDate`, OR `customDate` falls in the requested month — placed before `/:id` catch-all in the router.

## Product

- **Idea Management**: Create, branch, and search ideas with rich metadata (insight, origin, notes, video editing notes)
- **Content Calendar**: Monthly calendar view mapping ideas to created/scheduled/published dates
- **Trend Discovery**: Real-time trending topics & hashtags dashboard; analyze idea-trend fit; AI inspiration engine
- **Community / Social**: Friend requests, friend list, creator search by name/username
- **Direct Messages**: Conversations list + threaded messaging with 5s polling
- **Public Profiles**: Shareable `/profile/:username` pages for creators

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Codegen then typecheck**: Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`. It runs `typecheck:libs` internally — if that fails, check for name collisions between `components/schemas` entries and Orval's auto-generated param type names.
- **Calendar route order**: The `/calendar` endpoint must be declared BEFORE `/:id` in `ideas.ts` or Express treats "calendar" as an id.
- **Trend dashboard caching**: `trends.ts` caches the dashboard in-memory for 5 min to avoid hammering the provider on every tab switch.
- **lib/api-zod exports**: Do NOT re-add `export * from "./generated/types"` to `lib/api-zod/src/index.ts` — it causes TS2308 duplicate export errors because Orval generates same-named types in both files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.env.example` for all environment variables with descriptions and provider links
