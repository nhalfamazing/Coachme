/* The KoachMe verification ladder.
 *
 * This is the most distinctive thing the product publishes: a stated
 * standard for how much a number on a youth-sports profile can be trusted.
 * It is also the easiest thing on the site to accidentally lie about, so
 * each tier carries an explicit `live` flag and the page renders that state
 * rather than describing the ladder as though all of it works today.
 *
 * TODAY: only SELF is issued. src/app/app/page.tsx creates every stat with
 * `verified: 'self'`, and there is no interface for a coach, facility or
 * event to sign off on a number yet. The other three tiers are defined,
 * displayed, and not yet earnable — and this file says so, because a
 * verification standard that overstates itself is worse than none.
 */

export interface VerificationTier {
  /** The label as it appears on a stat card. */
  key: "SELF" | "TRAINER" | "FACILITY" | "EVENT";
  /** One-sentence definition, quotable on its own. */
  definition: string;
  /** Who can apply it. */
  who: string;
  /** What has to happen for a stat to carry it. */
  evidence: string;
  /** Whether an athlete can actually get this label today. */
  live: boolean;
}

export const VERIFICATION_TIERS: VerificationTier[] = [
  {
    key: "SELF",
    definition: "The athlete measured and entered the number themselves.",
    who: "The athlete, or a parent helping them.",
    evidence: "Nothing beyond the athlete entering it. The label exists so the number is never mistaken for a measured one.",
    live: true,
  },
  {
    key: "TRAINER",
    definition: "A verified coach watched the attempt and confirmed the number.",
    who: "A coach who has applied to KoachMe and passed review.",
    evidence: "The coach was present for the attempt and signs off on the result.",
    live: false,
  },
  {
    key: "FACILITY",
    definition: "A training facility measured the number with its own equipment.",
    who: "A facility KoachMe recognises.",
    evidence: "The measurement was taken on the facility's timing or testing equipment rather than a phone.",
    live: false,
  },
  {
    key: "EVENT",
    definition: "The number was recorded at an organized event.",
    who: "The event's operator.",
    evidence: "The result appears in the event's own official record.",
    live: false,
  },
];

/** Tiers an athlete can actually earn today. */
export function liveTiers(tiers: VerificationTier[] = VERIFICATION_TIERS): VerificationTier[] {
  return tiers.filter(t => t.live);
}

/** Tiers that are defined but not yet issuable. */
export function plannedTiers(tiers: VerificationTier[] = VERIFICATION_TIERS): VerificationTier[] {
  return tiers.filter(t => !t.live);
}

/** "TRAINER, FACILITY and EVENT" — for prose that names what is coming. */
export function plannedTierNames(tiers: VerificationTier[] = VERIFICATION_TIERS): string {
  const names = plannedTiers(tiers).map(t => t.key);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** All four definitions in one quotable sentence, built from the tiers so
 *  the prose cannot drift from the table underneath it. */
export function tierDefinitionsSentence(tiers: VerificationTier[] = VERIFICATION_TIERS): string {
  const parts = tiers.map(t => `${t.key} means ${t.definition.replace(/^The |^A /, m => m.toLowerCase())}`);
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`.replace(/\.\B/g, "");
}

/* --------------------------- Page Q&A ------------------------------- */

/* The questions this page answers, as data.
 *
 * Rendered as the page's visible headings AND as its FAQPage schema, from
 * this one array — which is the only way "the schema matches the visible
 * copy exactly" can be true a year from now. Sections needing richer markup
 * (the tier table, the not-verified list, the closing CTA) live in the page
 * component and are deliberately NOT in the schema: marking up content that
 * is not a plain question and answer is how a rich result gets withdrawn. */
export interface QaItem {
  /** Anchor id, so the heading is linkable and the schema can point at it. */
  id: string;
  question: string;
  /** Paragraphs, verbatim. Rendered visibly and joined for the schema. */
  answer: string[];
}

export function verificationQa(tiers: VerificationTier[] = VERIFICATION_TIERS): QaItem[] {
  const live = liveTiers(tiers).map(t => t.key).join(", ");
  const planned = plannedTierNames(tiers);
  return [
    {
      id: "labels",
      question: "What do SELF, TRAINER, FACILITY and EVENT mean?",
      answer: [
        `Every stat on a KoachMe athlete profile carries one of four labels showing how it was verified: ${tierDefinitionsSentence(tiers)}.`,
        "The label travels with the number everywhere it is shown, so a self-reported 40-yard dash can never be displayed as though a coach timed it.",
      ],
    },
    {
      id: "today",
      question: "Which labels can an athlete earn today?",
      answer: [
        `Only ${live}. Every stat created on KoachMe today is labeled SELF, because the athlete entered it themselves and nothing else has happened to it yet.`,
        `${planned} are defined, and a stat carrying one of them would display correctly, but there is no way to issue them yet: coach sign-off, facility measurement, and event records are still being built. We publish them here anyway so the standard is a commitment rather than a surprise, and so nobody has to guess what a label will mean when it arrives.`,
        "This is the honest state of a young product. A profile full of SELF labels is not a weakness of the system, it is the system working.",
      ],
    },
    {
      id: "why",
      question: "Why label every stat instead of just showing the number?",
      answer: [
        "Because an unlabeled number invites everyone to assume the best case. Recruiting and youth sport are full of numbers with no provenance, and the athlete who measured honestly is the one who loses when nobody can tell the difference.",
        "Labels make the honest number safe to publish. A SELF stat is not an accusation, it is a description, and it means the day a coach confirms that number, the change is visible and worth something.",
      ],
    },
    {
      id: "coaches",
      question: "How are coaches themselves verified?",
      answer: [
        "Coaches apply with their identity, credentials, sport, and rate. Nobody is listed without applying and being reviewed, every coach profile shows its real verification state, and only verified coaches can be booked.",
        "Full verification, meaning credential and background review, is being built now. Until it is finished, profiles show a pending badge rather than implying a review that has not happened.",
      ],
    },
  ];
}
