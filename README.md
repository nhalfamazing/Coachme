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

## After a deploy

Tell IndexNow (Bing, Yandex and others — not Google) which URLs changed:

```bash
pnpm indexnow
```

Defaults to everything that changed since `HEAD~1`: edited or added drill
pages, the sport hubs that list them, and any marketing page whose file
changed. `--all` submits every sitemap URL, `--dry-run` prints the selection
without sending it.

Run it **after** the deploy is live, never from a build step. IndexNow
verifies ownership by fetching `public/6f6d5aaa2a50f9e821042cd69e3ec899.txt`
from the site root, so submitting before the URLs exist announces pages that
would 404 — and a build hook would also fire on preview deploys against the
production host. The script refuses to submit unless it can fetch that key
file and confirm it serves the key. The key is deliberately public; that is
how the protocol works.

## Notes

- Local-first by design. Hosted Supabase comes later.
- shadcn CLI is not yet initialized in this scaffold. To add it later:
  ```bash
  pnpm dlx shadcn@latest init
  pnpm dlx shadcn@latest add button input label card
  ```
