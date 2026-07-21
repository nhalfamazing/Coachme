// Shared cloud data layer. When Supabase env vars are configured, every
// device reads and writes the same coaches / athletes / threads, which
// makes trainers, rosters, and messages work across devices. Without the
// env vars every helper is a safe no-op and the app stays device-local.
import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function cloudEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function cloud() {
  if (!cloudEnabled()) return null;
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Fetch every row's data payload from a table. Returns [] on any failure.
export async function cloudFetchAll(table: string): Promise<any[]> {
  try {
    const c = cloud();
    if (!c) return [];
    const { data, error } = await c.from(table).select("data").limit(1000);
    if (error) return [];
    return (data || []).map((r: any) => r.data).filter(Boolean);
  } catch {
    return [];
  }
}

// Insert-or-update one record. Fire-and-forget; never throws.
export async function cloudUpsert(table: string, id: unknown, dataObj: unknown): Promise<void> {
  try {
    const c = cloud();
    if (!c) return;
    await c.from(table).upsert({
      id: String(id),
      data: dataObj,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Cloud write failures must never break the local experience.
  }
}
