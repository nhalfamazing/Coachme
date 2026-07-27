import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../../_lib/api";

const LikeSchema = z.object({ code: z.string().min(3).max(80) });
const IdSchema = z.string().uuid();

// Toggle: like if not liked, unlike if already liked.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "posts/like");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { id } = await ctx.params;
    if (!IdSchema.safeParse(id).success) return jsonError(400, "invalid_input", "post id must be a uuid");

    const parsed = await parseBody(req, LikeSchema);
    if ("response" in parsed) return parsed.response;

    const profile = await profileByCode(client, parsed.data.code);
    if (!profile) return jsonError(404, "profile_not_found", "No profile with that code.");

    const post = await client.from("posts").select("*").eq("id", id).limit(1);
    if (post.error) throw new Error(`post lookup failed: ${post.error.message}`);
    if (!post.data?.[0]) return jsonError(404, "post_not_found", "No such post.");

    const existing = await client
      .from("post_likes").select("*")
      .eq("post_id", id).eq("profile_id", profile.id).limit(1);
    if (existing.error) throw new Error(`like lookup failed: ${existing.error.message}`);

    let liked: boolean;
    if (existing.data?.[0]) {
      const del = await client
        .from("post_likes").delete()
        .eq("post_id", id).eq("profile_id", profile.id);
      if (del.error) throw new Error(`unlike failed: ${del.error.message}`);
      liked = false;
    } else {
      const ins = await client
        .from("post_likes").insert({ post_id: id, profile_id: profile.id });
      if (ins.error && !/duplicate/i.test(ins.error.message)) {
        throw new Error(`like failed: ${ins.error.message}`);
      }
      liked = true;
    }

    const count = await client.from("post_likes").select("*").eq("post_id", id);
    if (count.error) throw new Error(`like count failed: ${count.error.message}`);
    return ok({ likes: (count.data ?? []).length, liked });
  });
}
