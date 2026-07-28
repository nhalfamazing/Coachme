/* ============================================================================
   Message safety patterns.

   This is the single reviewed module for KoachMe's message screening.
   Everything the server blocks or flags is defined here, in one place,
   with unit tests in patterns.test.ts. If you are changing safety policy,
   this file IS the policy.

   TWO TIERS:

   1. HARD BLOCK (checkHardBlock): the message is rejected and never
      stored. Categories: phone numbers, email addresses, street
      addresses, and requests to move the conversation off-platform.
      RATIONALE: KoachMe's safety model is on-platform-only contact
      between minors and adults, the standard kid-safety marketplace
      pattern. Off-platform contact defeats every other safeguard
      (flagging, review, blocking, the admin trail), so the platform
      refuses to transmit the invitation itself.

   2. FLAG BUT DELIVER (checkFlags): the message is delivered normally
      and a message_flags row is created for human review. Categories:
      secrecy language, meetup pressure, gift/money offers, photo
      requests, and age/school probing beyond sport context. These have
      legitimate look-alikes, so a human reviews them instead of the
      platform silently blocking normal coaching talk.

   NORMALIZATION: word patterns run against a lowercased, leetspeak-lite
   normalized copy (0->o, 3->e, 1->i, @->a, $->s, punctuation collapsed)
   so "d0n't t3ll y0ur p@rents" still matches. Digit patterns (phone
   numbers) run against the RAW text, because normalization destroys the
   digits they need.

   FALSE-POSITIVE GUARDS baked into the tests: sports usage of "call"
   ("call the pitch"), times ("10am", "7:30"), scores and stats ("85 mph",
   "went 3 for 4"), dates ("7/28/2026"), and parent-visible meetup
   planning ("see you at the field Saturday at 10am") must all pass.
   ============================================================================ */

export type SafetyCategory =
  // hard block
  | "phone_number"
  | "email_address"
  | "street_address"
  | "off_platform"
  // flag but deliver
  | "secrecy"
  | "meetup_pressure"
  | "gift_money"
  | "photo_request"
  | "personal_probing";

export interface SafetyHit {
  category: SafetyCategory;
  /** Which pattern fired: stored in message_flags.matched_pattern for
   *  admin review. Never shown to end users. */
  pattern: string;
}

/** Kid-readable rejection shown when a message is hard-blocked. Short,
 *  warm, sentence case, not scary. */
export const BLOCK_MESSAGE =
  "This message can't be sent. To keep everyone safe, conversations stay inside KoachMe. Please don't share phone numbers, emails, addresses, or ask to chat on other apps.";

/* ----------------------------- normalization ----------------------------- */

/** Lowercase + leetspeak-lite + collapse separators, for word patterns. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    // collapse anything that is not a letter or digit into single spaces
    // so "d.o.n.t  tell" and "don't tell" both become "d o n t tell" /
    // "dont tell" comparable forms; apostrophes vanish entirely.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ------------------------------ hard block ------------------------------- */

// Phone numbers. Runs on RAW text. Two forms:
// - 10+ digits in one separated run ("305-555-0134", "305 555 0134",
//   "3055550134", "+1 305.555.0134"): matched with no context needed.
// - 7-9 digits when phone context words appear nearby ("call me at
//   555 0134"). Dates like 7/28/2026 (7-8 digits) and times/stats never
//   reach 10 digits and carry no phone context, so they pass.
const LONG_DIGIT_RUN = /(?:\+?\d[\s().\-\/]*){10,15}\d?/;
const SHORT_DIGIT_RUN = /(?:\d[\s().\-]*){7,9}\d?/;
const PHONE_CONTEXT =
  /\b(?:call|text|phone|cell|number|digits|reach|hit)\b[^.!?\n]{0,30}?(?:me|us|him|her)?[^.!?\n]{0,15}?(?=\d)/i;

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

function hasPhoneNumber(raw: string): boolean {
  const long = raw.match(LONG_DIGIT_RUN);
  if (long && countDigits(long[0]) >= 10 && countDigits(long[0]) <= 16) {
    // Guard: pure date-like strings can only reach 8 digits; 10+ digit
    // runs are phone-shaped. Years alone ("2026") never get here.
    return true;
  }
  if (PHONE_CONTEXT.test(raw)) {
    const short = raw.match(SHORT_DIGIT_RUN);
    if (short && countDigits(short[0]) >= 7) return true;
  }
  return false;
}

// Email addresses, raw text. Also catches spaced obfuscation "name at
// gmail dot com".
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EMAIL_OBFUSCATED_RE =
  /\b[a-z0-9._%+-]{2,}\s+(?:at|@)\s+(?:gmail|yahoo|hotmail|outlook|icloud|aol|proton(?:mail)?)\s*(?:dot|\.)\s*com\b/i;

// Street addresses, raw text: house number + street name + street suffix.
const STREET_RE =
  /\b\d{1,6}\s+(?:[a-z]+\s+){0,3}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|place|pl|way|terrace|ter|circle|cir)\b\.?/i;

// Off-platform moves, normalized text. App names as whole words, handle
// patterns, and "text/dm/add me" constructions.
const OFF_PLATFORM_PATTERNS: Array<{ pattern: string; re: RegExp }> = [
  { pattern: "app_name", re: /\b(?:snapchat|snap ?chat|instagram|insta|whats ?app|discord|tik ?tok|telegram|kik|facetime|face ?time)\b/ },
  // "ig" and "snap" are short words with sports look-alikes kept out of
  // the bare list; they only fire in "add/on/my X" constructions below.
  { pattern: "add_me_on", re: /\badd me (?:on|at)\b/ },
  { pattern: "dm_me", re: /\bdm me\b/ },
  { pattern: "text_me", re: /\btext me\b/ },
  { pattern: "my_handle", re: /\bmy (?:ig|insta|snap|user(?:name)?|handle|discord|tag)\b/ },
  { pattern: "find_me_on", re: /\b(?:find|follow|message|hit) me (?:on|at|up on)\b/ },
  { pattern: "off_the_app", re: /\b(?:off (?:the|this) app|outside (?:the|this) app|somewhere else to talk|different app)\b/ },
];

// @-handle in raw text: @username that is not an email (no dot-tld after).
const AT_HANDLE_RE = /(?:^|\s)@[a-z0-9_.]{3,30}\b(?!\.[a-z]{2,})/i;

/** Returns a hit if the message must be rejected outright. */
export function checkHardBlock(text: string): SafetyHit | null {
  const raw = text;
  const norm = normalize(text);

  if (EMAIL_RE.test(raw) || EMAIL_OBFUSCATED_RE.test(raw)) {
    return { category: "email_address", pattern: "email" };
  }
  if (hasPhoneNumber(raw)) {
    return { category: "phone_number", pattern: "phone" };
  }
  if (STREET_RE.test(raw)) {
    return { category: "street_address", pattern: "street_address" };
  }
  for (const { pattern, re } of OFF_PLATFORM_PATTERNS) {
    if (re.test(norm)) return { category: "off_platform", pattern };
  }
  if (AT_HANDLE_RE.test(raw)) {
    return { category: "off_platform", pattern: "at_handle" };
  }
  return null;
}

/* --------------------------- flag but deliver ---------------------------- */

const FLAG_PATTERNS: Array<{ category: SafetyCategory; pattern: string; re: RegExp }> = [
  // Secrecy: adults asking kids to keep things from parents is the
  // highest-signal grooming marker there is.
  { category: "secrecy", pattern: "dont_tell", re: /\bdont tell (?:your |any)?(?:parents?|mom|dad|anyone|anybody|coach)\b/ },
  { category: "secrecy", pattern: "our_secret", re: /\b(?:our|its our|this is our) (?:little )?secret\b/ },
  { category: "secrecy", pattern: "between_us", re: /\b(?:just )?between (?:us|you and me)\b/ },
  { category: "secrecy", pattern: "keep_this", re: /\bkeep (?:this|it) (?:between|quiet|private|to yourself)\b/ },
  { category: "secrecy", pattern: "delete_this", re: /\bdelete (?:this|these|our) (?:message|messages|chat|conversation)\b/ },

  // Meetup pressure: normal coaching schedules sessions in the open;
  // pressure to come alone or exclude adults is the signal.
  { category: "meetup_pressure", pattern: "meet_alone", re: /\b(?:meet|come|see) (?:me |up )?(?:by yourself|alone)\b/ },
  { category: "meetup_pressure", pattern: "dont_bring", re: /\bdont bring (?:your |any)?(?:parents?|mom|dad|anyone|anybody)\b/ },
  { category: "meetup_pressure", pattern: "just_us", re: /\b(?:just|only) (?:us|you and me) (?:there|at the|this time)\b/ },
  { category: "meetup_pressure", pattern: "pick_you_up", re: /\b(?:ill|i will|i can|let me) pick you up\b/ },

  // Gifts and money offered to athletes.
  { category: "gift_money", pattern: "buy_you", re: /\b(?:ill|i will|i can|let me|i want to) (?:buy|get) you\b/ },
  { category: "gift_money", pattern: "give_send_money", re: /\b(?:give|send|pay) you (?:some |the )?(?:money|cash)\b/ },
  { category: "gift_money", pattern: "payment_app", re: /\b(?:venmo|cash ?app|zelle|paypal|apple pay)\b/ },
  { category: "gift_money", pattern: "gift_card", re: /\bgift ?cards?\b/ },
  { category: "gift_money", pattern: "free_stuff", re: /\b(?:for )?free (?:gear|equipment|shoes|cleats|tickets)\b/ },

  // Photo requests. Form-check video language is normal coaching; the
  // patterns target photos OF the athlete, not of the swing.
  { category: "photo_request", pattern: "send_photo_of_you", re: /\bsend (?:me )?(?:a |some )?(?:photo|photos|pic|pics|picture|pictures|selfie|selfies)(?: of (?:you|yourself))?\b/ },
  { category: "photo_request", pattern: "what_do_you_look_like", re: /\bwhat do you look like\b/ },
  { category: "photo_request", pattern: "camera_on", re: /\bturn (?:your |the )?camera on\b/ },

  // Personal probing beyond sport context. Sport, position, city are
  // profile-visible; school names, being home alone, and "real age"
  // probing are not coaching questions.
  { category: "personal_probing", pattern: "what_school", re: /\b(?:what|which) school (?:do you go to|are you at)\b/ },
  { category: "personal_probing", pattern: "home_alone", re: /\b(?:are you|you) home alone\b/ },
  { category: "personal_probing", pattern: "parents_home", re: /\b(?:are your|your) parents (?:home|there|around)\b/ },
  { category: "personal_probing", pattern: "real_age", re: /\bhow old are you really\b/ },
  { category: "personal_probing", pattern: "where_live", re: /\bwhere (?:do you|exactly do you) live\b/ },
];

/** Returns every flag category the message trips (deduped by category).
 *  The message is still delivered; these go to the review queue. */
export function checkFlags(text: string): SafetyHit[] {
  const norm = normalize(text);
  const hits: SafetyHit[] = [];
  const seen = new Set<string>();
  for (const { category, pattern, re } of FLAG_PATTERNS) {
    if (re.test(norm) && !seen.has(category)) {
      seen.add(category);
      hits.push({ category, pattern });
    }
  }
  return hits;
}
