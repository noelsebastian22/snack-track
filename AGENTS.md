<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, no test runner exists)
- No test script or test framework is configured

## Architecture

- **Next.js 16.2.6** + **React 19** using the App Router (`src/app/`)
- **Path alias**: `@/*` → `./src/*`
- **Supabase** for DB + auth via `@supabase/ssr` (separate browser/server/middleware clients in `src/utils/supabase/`)
- **Root middleware** (`src/middleware.ts`) refreshes Supabase sessions on every request; auth guard is commented out (no login route exists yet)

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing / product listing (`src/app/page.tsx`) |
| `/admin/` | Admin area (dashboard + product management) |
| `/verify/[order_id]` | Order verification page |

## Supabase

- Schema in `supabase/schema.sql` — tables: `products`, `orders` with RLS policies
- Storage bucket `snack-images` is referenced in schema comments but must be created via Supabase Dashboard/API
- Required env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server client (`src/utils/supabase/server.ts`) uses `await cookies()` — always await it before calling `createClient()`

## Conventions

- Strict TypeScript (`strict: true`), ESLint flat config with `eslint-config-next` core-web-vitals + typescript
- Order `total_amount` and product `price` are stored in **cents** (smallest currency unit)
- `orders.items` is a `jsonb` column: array of `{product_id, name, qty, price}`
