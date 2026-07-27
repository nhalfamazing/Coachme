import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../_lib/api";

const IdSchema = z.string().uuid();

// Author-only delete, validated by code (?code=three-word-code).
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "posts/delete");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { id } = await ctx.params;
    if (!IdSchema.safeParse(id).success) return jsonError(400, "invalid_input", "post id must be a uuid");
    const code = new URL(req.url).searchParams.get("code");
    if (!code) return jsonError(400, "invalid_input", "code query param is required");

    const profile = await profileByCode(client, code);
    if (!profile) return jsonError(404, "profile_not_found", "No profile with that code.");

    const post = await client.from("posts").select("*").eq("id", id).limit(1);
    if (post.error) throw new Error(`post lookup failed: ${post.error.message}`);
    if (!post.data?.[0]) return jsonError(404, "post_not_found", "No such post.");
    if (post.data[0].author_id !== profile.id) {
      return jsonError(403, "not_author", "Only the author can delete a post.");
    }

    const del = await client.from("posts").delete().eq("id", id);
    if (del.error) throw new Error(`post delete failed: ${del.error.message}`);
    return ok({ deleted: true });
  });
}
