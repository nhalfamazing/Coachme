/* GENERATED FILE — do not edit by hand.
   Source: data/drills-manifest.json
   Regenerate: pnpm build:drills   (see scripts/build-drills.mjs)

   Drill Library: AI-generated coach clips, clearly labeled as AI in
   every surface that renders them. Each asset carries two URLs:
   - cdn:  original Higgsfield CloudFront source, kept for provenance /
           re-mirroring ONLY ('' when the source went straight to Blob).
           Never serve these — they rotate and die without warning.
   - blob: our mirrored copy on Vercel Blob. This is what the app serves.
   Every blob URL below was HEAD-verified at generation time; drills with
   missing assets are excluded by the generator. */

export type DrillSport = "Basketball" | "Soccer" | "Baseball" | "Football" | "Track";

export interface DrillAsset {
  /** Original CDN source — provenance only, never served. */
  cdn: string;
  /** Our mirrored copy on Vercel Blob — what the app serves. */
  blob: string;
}

export interface DrillCoach {
  id: string;
  name: string;
  /** One-line character description, straight from the manifest. */
  style: string;
  portrait: DrillAsset;
  portraitVideo: DrillAsset | null;
}

export interface Drill {
  id: string;
  sport: DrillSport;
  title: string;
  cue: string;
  level: string;
  focus: string;
  coachId: string;
  /** ISO date the drill entered the library; drives the NEW tag. */
  addedAt: string;
  intro: DrillAsset;
  demo: DrillAsset;
  poster: DrillAsset;
}

export const DRILL_BLOB_BASE = "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com";

export const COACHES: DrillCoach[] = [
  {
    id: "coach-farm",
    name: "FARM Coach",
    style: "High-energy fundamentals coach. The original.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_003605_9fbc7e25-4227-468f-a09a-e6658825dba0.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-farm/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-vega",
    name: "Coach Vega",
    style: "Precision and footwork. Racquet and net sports.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111340_975c9432-333e-474c-98cd-8829811d14e8.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-vega/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-sato",
    name: "Coach Sato",
    style: "Speed and mechanics. Track and field.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111345_129ff9f6-bbb6-454a-a3da-8e65a9f8aa57.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-sato/portrait.png" },
    portraitVideo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_113430_a6b45003-a510-4fc9-96c0-0ebd7a9795fc.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-sato/portrait.mp4" },
  },
];

export const DRILLS: Drill[] = [
  {
    id: "bb-crossover",
    sport: "Basketball",
    title: "Crossover",
    cue: "Snap the ball across your body and change direction.",
    level: "beginner",
    focus: "ball handling",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005010_50b1a8b7-176c-4769-83a5-84d548b43193.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-crossover/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005024_03687e08-51b3-46c7-971c-db1eb40f0885.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-crossover/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_003605_9fbc7e25-4227-468f-a09a-e6658825dba0.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-crossover/poster.png" },
  },
  {
    id: "bb-form-shooting",
    sport: "Basketball",
    title: "Form shooting",
    cue: "Build a clean shot from close range, one rep at a time.",
    level: "beginner",
    focus: "shooting",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010030_c8f4cc7c-f80c-45f3-bfdd-696672975daa.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-form-shooting/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010037_17fbac40-451b-4456-9aa1-b3bb3021ac4a.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-form-shooting/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_003605_9fbc7e25-4227-468f-a09a-e6658825dba0.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-form-shooting/poster.png" },
  },
  {
    id: "so-inside-pass",
    sport: "Soccer",
    title: "Inside pass",
    cue: "Pass with the inside of your foot for accuracy.",
    level: "beginner",
    focus: "passing",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010043_7e65c1db-3c44-4bc2-b5d6-942ad083bdcd.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-inside-pass/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010051_03fe3035-a7ea-417f-97cc-d79481d65ed3.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-inside-pass/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005814_88206a71-adb4-4295-9ccb-66f72ce85f79.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-inside-pass/poster.png" },
  },
  {
    id: "so-first-touch",
    sport: "Soccer",
    title: "First touch",
    cue: "Cushion the ball so your next move is already set up.",
    level: "beginner",
    focus: "control",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010057_6bcc39f8-5cd0-4edf-a583-6e80f501016a.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-first-touch/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010102_d75cd1f4-7c2c-42cf-8ba6-cf114d704b62.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-first-touch/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005814_88206a71-adb4-4295-9ccb-66f72ce85f79.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-first-touch/poster.png" },
  },
  {
    id: "ba-tee-work",
    sport: "Baseball",
    title: "Tee work",
    cue: "Groove your swing path off the tee.",
    level: "beginner",
    focus: "hitting",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010109_4cb2b3ae-97a2-427f-91a0-656b2dad870f.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-tee-work/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010115_b6969706-8ef9-4e7e-b75d-94a6110f73bf.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-tee-work/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005819_0cc507c8-0f65-4461-9fb9-0f4c32f908a7.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-tee-work/poster.png" },
  },
  {
    id: "ba-ready-position",
    sport: "Baseball",
    title: "Ready position",
    cue: "Get in an athletic stance before every pitch.",
    level: "beginner",
    focus: "fielding",
    coachId: "coach-farm",
    addedAt: "2026-07-23",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010121_3000a2d9-82c3-4a3b-938b-5695173150b5.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-ready-position/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_010128_fb22663c-6dce-4d51-ab3a-5a1fd1cb8dd5.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-ready-position/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_005819_0cc507c8-0f65-4461-9fb9-0f4c32f908a7.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-ready-position/poster.png" },
  },
  {
    id: "fb-catch-triangle",
    sport: "Football",
    title: "Catch triangle",
    cue: "Palms out, thumbs and pointer fingers make a triangle. Catch with your hands, not your body.",
    level: "beginner",
    focus: "hands",
    coachId: "coach-farm",
    addedAt: "2026-07-28",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_113706_49cd786b-0ba5-47e0-a9bd-436422f0fb54.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-catch-triangle/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111401_7d87283c-7141-496d-a04d-7a07923b4d07.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-catch-triangle/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111401_7d87283c-7141-496d-a04d-7a07923b4d07.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-catch-triangle/poster.png" },
  },
  {
    id: "fb-stance-start",
    sport: "Football",
    title: "Three-point stance",
    cue: "Low stance, flat back, head up. Explode out on the first step.",
    level: "beginner",
    focus: "explosiveness",
    coachId: "coach-farm",
    addedAt: "2026-07-28",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111407_2973dd63-74fb-4077-b7c6-fc408e275624.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-stance-start/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111413_951b3500-d8e4-48f8-bbbb-6dbfc41a71fa.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-stance-start/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111413_951b3500-d8e4-48f8-bbbb-6dbfc41a71fa.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/fb-stance-start/poster.png" },
  },
  {
    id: "tr-sprint-start",
    sport: "Track",
    title: "Sprint start",
    cue: "Stay low out of your stance and drive for the first steps.",
    level: "beginner",
    focus: "acceleration",
    coachId: "coach-farm",
    addedAt: "2026-07-28",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111420_23ed7667-8ffb-490d-95a0-f025c24eed36.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-sprint-start/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111427_c4b6122f-8d55-4957-b9b1-fdc250c2702b.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-sprint-start/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111427_c4b6122f-8d55-4957-b9b1-fdc250c2702b.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-sprint-start/poster.png" },
  },
  {
    id: "tr-arm-drive",
    sport: "Track",
    title: "Arm drive",
    cue: "Elbows at 90, hands cheek to pocket. Fast arms make fast legs.",
    level: "beginner",
    focus: "mechanics",
    coachId: "coach-farm",
    addedAt: "2026-07-28",
    intro: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111433_f98d87d0-adbc-4c89-9782-4cd31096e7a4.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-arm-drive/intro.mp4" },
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111446_5b56ad59-99af-47f4-9a0c-5a255f74ea50.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-arm-drive/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260728_111446_5b56ad59-99af-47f4-9a0c-5a255f74ea50.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-arm-drive/poster.png" },
  },
];

/** Sports in manifest order; counts derive from DRILLS at the callsite. */
export const SPORTS: DrillSport[] = ["Basketball", "Soccer", "Baseball", "Football", "Track"];

export function coachFor(drill: Drill): DrillCoach {
  // The generator guarantees every coachId resolves.
  return COACHES.find(c => c.id === drill.coachId)!;
}
