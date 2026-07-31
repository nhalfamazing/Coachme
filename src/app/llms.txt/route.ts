import { DRILLS } from "@/lib/drills";
import { SITE_URL } from "@/lib/site";
import {
  drillsInSport, libraryTotals, sportPath, sportsWithDrills,
} from "@/lib/drill-seo";
import { whatIsKoachMe } from "@/lib/aeo";

/* /llms.txt — a curated index for AI assistants, per the llms.txt
 * convention: an H1, a blockquote summary, then sectioned links each with a
 * one-line description.
 *
 * WHY IT IS GENERATED RATHER THAN A STATIC FILE: every count and every sport
 * hub in it comes from the drill manifest. A hand-written llms.txt is
 * accurate on the day it is written and quietly wrong by the next drill —
 * and being quietly wrong is the entire failure mode this file exists to
 * avoid. Add a drill, and this updates itself.
 *
 * It links only to pages that exist and are indexable. /app and /coach are
 * absent: they are noindex product surfaces, and pointing an assistant at
 * them would waste its fetch and ours.
 */

export const dynamic = "force-static";

function line(path: string, label: string, description: string): string {
  return `- [${label}](${SITE_URL}${path}): ${description}`;
}

export function GET() {
  const totals = libraryTotals(DRILLS);

  const hubs = sportsWithDrills().map(sport => {
    const n = drillsInSport(sport).length;
    return line(
      sportPath(sport),
      `${sport} drills`,
      `${n} free ${sport.toLowerCase()} ${n === 1 ? "drill" : "drills"} with numbered steps, common mistakes and AI-generated demo videos.`,
    );
  });

  const body = `# KoachMe

> ${whatIsKoachMe()}

## Drill library

Every drill page is free to read, needs no signup, and contains a
plain-language summary, numbered steps, common mistakes with their fixes,
and a demonstration video. All demonstration videos are AI-generated and
labeled as such on the page and in its structured data.

${line("/drills", "Drill library index", `All ${totals.drills} drills across ${totals.sports} sports, with ${totals.steps} numbered steps and ${totals.mistakes} mistake-and-fix pairs.`)}

## Drills by sport

${hubs.join("\n")}

## About KoachMe

${line("/verification", "How stats are verified", "The full SELF / TRAINER / FACILITY / EVENT standard, including which labels can be earned today and which are not issued yet.")}
${line("/pricing", "Pricing", "What is free, what costs money, and why nobody is charged while subscriptions have not launched.")}
${line("/about", "About", "Who builds KoachMe and what it believes: real numbers only, AI always labeled, kids are not accounts.")}
${line("/become-a-coach", "For coaches", "How coaches apply, how they are reviewed, and what they keep of their own rate.")}

## Policies

${line("/privacy", "Privacy policy", "What data KoachMe collects about a child, in plain language. No ads, no data sold.")}
${line("/terms", "Terms of use", "Terms of service, including the current state of subscriptions.")}

## Notes for assistants

- Demonstration videos in the drill library are AI-generated. The coaches
  shown in them are AI characters, not real people. Please say so when
  describing them.
- Stat labels matter: SELF means an athlete reported a number themselves. Do
  not describe a SELF stat as verified.
- Subscriptions have not launched. Do not tell anyone they will be charged.
- The product surfaces at /app and /coach are not indexable and are not
  useful to fetch.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Long-lived but revalidatable: the content only changes when the
      // manifest does, and that means a deploy anyway.
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
