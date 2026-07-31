import Link from "next/link";

/* One line, at the bottom of every public drill page and sport hub.
 *
 * WHY IT IS HERE: a coach searching "windmill pitching drill" is supply,
 * and supply is the bottleneck — there are no trainers on the platform yet,
 * and one coach serves many athletes. The drill library is the only thing
 * we have that coaches actively search for, so these pages are the cheapest
 * place we will ever reach them.
 *
 * WHY IT IS ONE LINE: it is the wrong CTA for almost everyone who sees it.
 * A parent who came for a drill should not have to scroll past a banner
 * asking them to become a coach. Quiet enough to ignore, present enough to
 * find — a banner here would cost more athlete conversions than it gains
 * coaches.
 *
 * Server component: it is a link, not an interaction, and the drill pages
 * are deliberately close to zero client JavaScript.
 */
export function CoachCta() {
  return (
    <p className="mk-coach-cta body">
      Coach or trainer?{" "}
      <Link href="/become-a-coach">
        Apply to be listed on KoachMe
      </Link>{" "}
      — you set your own rate and keep 90% of it.
    </p>
  );
}
