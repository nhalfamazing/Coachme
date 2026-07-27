import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode, normalizeCode } from "../_lib/api";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  authorCode: z.string().min(3).max(80),
  body: z.string().min(1).max(280),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "posts/create");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, CreateSchema);
    if ("response" in parsed) return parsed.response;

    const author = await profileByCode(client, parsed.data.authorCode);
    if (!author) return jsonError(404, "author_not_found", "No profile with that code.");

    const inserted = await client
      .from("posts")
      .insert({ author_id: author.id, body: parsed.data.body })
      .select();
    if (inserted.error) throw new Error(`post insert failed: ${inserted.error.message}`);
    return ok({ post: inserted.data && inserted.data[0], author }, 201);
  });
}

// The shared feed. ?viewer=<code> additionally marks which posts the
// viewer has liked.
export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "posts/list");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const viewerCode = new URL(req.url).searchParams.get("viewer");

    const found = await client
      .from("posts").select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (found.error) throw new Error(`posts query failed: ${found.error.message}`);
    const posts = found.data ?? [];
    if (posts.length === 0) return ok({ posts: [] });

    const authorIds = [...new Set(posts.map(p => p.author_id))];
    const authors = await client.from("profiles").select("*").in("id", authorIds);
    if (authors.error) throw new Error(`authors query failed: ${authors.error.message}`);
    const byId = new Map((authors.data ?? []).map(p => [p.id, p]));

    const likes = await client
      .from("post_likes").select("*")
      .in("post_id", posts.map(p => p.id));
    if (likes.error) throw new Error(`likes query failed: ${likes.error.message}`);

    let viewerId: string | null = null;
    if (viewerCode) {
      const viewer = await profileByCode(client, normalizeCode(viewerCode));
      viewerId = viewer?.id ?? null;
    }

    const likeCount = new Map<string, number>();
    const likedByViewer = new Set<string>();
    for (const l of likes.data ?? []) {
      likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
      if (viewerId && l.profile_id === viewerId) likedByViewer.add(l.post_id);
    }

    return ok({
      posts: posts.map(p => ({
        post: p,
        author: byId.get(p.author_id) ?? null,
        likes: likeCount.get(p.id) ?? 0,
        likedByViewer: likedByViewer.has(p.id),
      })),
    });
  });
}
