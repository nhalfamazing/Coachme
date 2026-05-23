# CoachMe

The performance graph for emerging athletes. Mobile-first, multi-sport.

## Local dev quickstart

```bash
# 1. install deps
pnpm install

# 2. copy env template (fill in once Supabase is running)
cp .env.local.example .env.local

# 3. start Supabase locally (Docker required)
./scripts/supabase-start.sh
# or: pnpm exec supabase start

# 4. run the Next.js dev server
pnpm dev
```

After `supabase start`, the CLI prints local `API URL`, `anon key`, and `service_role key`. Paste those into `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` -> the local API URL (default `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> the local anon key
- `SUPABASE_SERVICE_ROLE_KEY` -> the local service_role key (server-only)

To stop the local Supabase stack:

```bash
./scripts/supabase-stop.sh
```

## Stack

- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS v4
- Base UI (`@base-ui-components/react`)
- Lucide icons
- Supabase JS client + `@supabase/ssr`
- Supabase CLI (local dev)
- pnpm

## Layout

```
src/
  app/
    (marketing)/page.tsx   # landing
    layout.tsx             # root, mobile-first
  components/ui/           # shadcn lives here once initialized
  lib/supabase/
    client.ts              # browser client
    server.ts              # server client (cookies)
supabase/
  migrations/
  seed.sql
scripts/
  supabase-start.sh
  supabase-stop.sh
```

## Notes

- Local-first by design. Hosted Supabase comes later.
- shadcn CLI is not yet initialized in this scaffold. To add it later:
  ```bash
  pnpm dlx shadcn@latest init
  pnpm dlx shadcn@latest add button input label card
  ```
