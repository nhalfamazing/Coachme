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

export type DrillSport = "Basketball" | "Soccer" | "Baseball" | "Football" | "Track" | "Volleyball" | "Softball";

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
  /** null = single-clip drill: no coach intro, the demo is the whole clip. */
  intro: DrillAsset | null;
  demo: DrillAsset;
  poster: DrillAsset;
}

export const DRILL_BLOB_BASE = "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com";

export const COACHES: DrillCoach[] = [
  {
    id: "coach-farm",
    name: "Koach Farm",
    style: "High-energy fundamentals coach. The original.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260723_003605_9fbc7e25-4227-468f-a09a-e6658825dba0.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-farm/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-amari",
    name: "Koach Amari",
    style: "Handles and finishing. Reps until it's automatic.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_123349_9f6ad750-54f3-4ca3-915e-ad32dbe9d836.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-amari/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-nia",
    name: "Koach Nia",
    style: "Close control and first touch. Small touches, big difference.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125859_3ecb475e-c0e1-4fcd-bd6a-2de7d2cd9511.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-nia/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-rio",
    name: "Koach Rio",
    style: "Swing path and glove work. Clean reps only.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_123402_862a9fdc-54e7-44bf-ac71-77c15f5376d0.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-rio/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-sol",
    name: "Koach Sol",
    style: "Platform and hands. Control before power.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125847_c56bacaf-463c-4584-bf02-5f5d580c5417.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-sol/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-zuri",
    name: "Koach Zuri",
    style: "Sprint mechanics. Fast is a skill you practice.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125853_cc01940a-20ad-486d-8ad1-e7fb03558617.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-zuri/portrait.png" },
    portraitVideo: null,
  },
  {
    id: "coach-marisol",
    name: "Koach Marisol",
    style: "Circle work and swings. Repeat it until it's yours.",
    portrait: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125904_cbe49047-be4c-471d-8eb4-d96ad0777a27.png", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/coaches/coach-marisol/portrait.png" },
    portraitVideo: null,
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
  {
    id: "bb-two-ball",
    sport: "Basketball",
    title: "Two-ball dribbling",
    cue: "Dribble two balls at once. Your weak hand gets a lot better, fast.",
    level: "beginner",
    focus: "ball handling",
    coachId: "coach-amari",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125029_efbc8089-ec49-4939-a9bc-df46f1e7691e.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-two-ball/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125029_efbc8089-ec49-4939-a9bc-df46f1e7691e.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-two-ball/poster.png" },
  },
  {
    id: "bb-mikan",
    sport: "Basketball",
    title: "Mikan drill",
    cue: "Layups off both hands, back and forth under the rim.",
    level: "beginner",
    focus: "finishing",
    coachId: "coach-amari",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125035_2d08f7ed-a2b8-4f02-8531-46b8e41ea322.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-mikan/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125035_2d08f7ed-a2b8-4f02-8531-46b8e41ea322.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-mikan/poster.png" },
  },
  {
    id: "so-cone-dribble",
    sport: "Soccer",
    title: "Cone dribbling",
    cue: "Weave through cones with small touches. Keep the ball close.",
    level: "beginner",
    focus: "close control",
    coachId: "coach-nia",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125041_14c2318e-75c0-43cc-969a-2a143fc546af.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-cone-dribble/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125041_14c2318e-75c0-43cc-969a-2a143fc546af.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-cone-dribble/poster.png" },
  },
  {
    id: "so-juggling",
    sport: "Soccer",
    title: "Juggling",
    cue: "Keep it off the ground. Start with two, then beat your record.",
    level: "beginner",
    focus: "touch",
    coachId: "coach-nia",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125053_df3e3dcb-287c-4c8c-8721-130305c2349d.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-juggling/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125053_df3e3dcb-287c-4c8c-8721-130305c2349d.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-juggling/poster.png" },
  },
  {
    id: "ba-tee-drive",
    sport: "Baseball",
    title: "Tee drive",
    cue: "Load the back hip and drive through the ball. Finish balanced.",
    level: "beginner",
    focus: "hitting",
    coachId: "coach-rio",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125059_c5de3c1a-74cd-4cbf-813d-f885a5e204f8.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-tee-drive/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125059_c5de3c1a-74cd-4cbf-813d-f885a5e204f8.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-tee-drive/poster.png" },
  },
  {
    id: "ba-ground-balls",
    sport: "Baseball",
    title: "Ground balls",
    cue: "Glove down, field it out front with two hands, step into the throw.",
    level: "beginner",
    focus: "fielding",
    coachId: "coach-rio",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125106_b728f667-3c0a-4bcd-893f-cf1c9aad7de5.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-ground-balls/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_125106_b728f667-3c0a-4bcd-893f-cf1c9aad7de5.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/ba-ground-balls/poster.png" },
  },
  {
    id: "vb-forearm-pass",
    sport: "Volleyball",
    title: "Forearm passing",
    cue: "Flat platform, low stance. Let the ball come to you.",
    level: "beginner",
    focus: "passing",
    coachId: "coach-sol",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130409_503f0071-c091-46a2-92e1-bbeba263d703.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/vb-forearm-pass/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130409_503f0071-c091-46a2-92e1-bbeba263d703.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/vb-forearm-pass/poster.png" },
  },
  {
    id: "vb-setting",
    sport: "Volleyball",
    title: "Overhead setting",
    cue: "Hands make a window above your forehead. Push with your legs.",
    level: "beginner",
    focus: "setting",
    coachId: "coach-sol",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130415_c3d421ea-b832-40cc-ad62-69be750dae45.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/vb-setting/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130415_c3d421ea-b832-40cc-ad62-69be750dae45.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/vb-setting/poster.png" },
  },
  {
    id: "tr-a-skip",
    sport: "Track",
    title: "A-skip",
    cue: "Knee up, toe up, land on the ball of your foot. Rhythm over speed.",
    level: "beginner",
    focus: "mechanics",
    coachId: "coach-zuri",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130421_807efd8d-c7e5-4fd5-a0ad-d3bbcc3449ae.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-a-skip/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130421_807efd8d-c7e5-4fd5-a0ad-d3bbcc3449ae.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-a-skip/poster.png" },
  },
  {
    id: "tr-bounding",
    sport: "Track",
    title: "Bounding",
    cue: "Big leaping strides. This is how you build a stronger push.",
    level: "beginner",
    focus: "power",
    coachId: "coach-zuri",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130429_a103a8b1-afe3-4114-8b17-3e5f6f5aea7f.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-bounding/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130429_a103a8b1-afe3-4114-8b17-3e5f6f5aea7f.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/tr-bounding/poster.png" },
  },
  {
    id: "so-laces-shot",
    sport: "Soccer",
    title: "Laces shooting",
    cue: "Plant beside the ball and strike through the middle with your laces.",
    level: "beginner",
    focus: "shooting",
    coachId: "coach-nia",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130436_9cdaf7b3-54f4-4af3-9966-13a801099fc2.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-laces-shot/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130436_9cdaf7b3-54f4-4af3-9966-13a801099fc2.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-laces-shot/poster.png" },
  },
  {
    id: "so-sole-rolls",
    sport: "Soccer",
    title: "Sole rolls and pull-backs",
    cue: "Roll it side to side, then pull it back and turn away.",
    level: "beginner",
    focus: "footwork",
    coachId: "coach-nia",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130442_cd811bc2-62d6-415b-b4dc-4f18c9921d1a.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-sole-rolls/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130442_cd811bc2-62d6-415b-b4dc-4f18c9921d1a.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/so-sole-rolls/poster.png" },
  },
  {
    id: "sb-windmill",
    sport: "Softball",
    title: "Windmill pitching",
    cue: "Full circle over the top, release past the hip, finish balanced.",
    level: "beginner",
    focus: "pitching",
    coachId: "coach-marisol",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130454_bc84a859-456c-4fa4-b28d-5f642f39bc65.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/sb-windmill/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130454_bc84a859-456c-4fa4-b28d-5f642f39bc65.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/sb-windmill/poster.png" },
  },
  {
    id: "sb-soft-toss",
    sport: "Softball",
    title: "Soft toss",
    cue: "Someone tosses from the side, you drive it into the net. Level swing.",
    level: "beginner",
    focus: "hitting",
    coachId: "coach-marisol",
    addedAt: "2026-07-29",
    intro: null,
    demo: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130500_e7705650-9b74-4ac4-827e-a871f93c5b88.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/sb-soft-toss/demo.mp4" },
    poster: { cdn: "https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/hf_20260729_130500_e7705650-9b74-4ac4-827e-a871f93c5b88.mp4", blob: "https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/sb-soft-toss/poster.png" },
  },
];

/** Sports in manifest order; counts derive from DRILLS at the callsite. */
export const SPORTS: DrillSport[] = ["Basketball", "Soccer", "Baseball", "Football", "Track", "Volleyball", "Softball"];

/** Display metadata for every sport the manifest supports, keyed by
    display name — includes sports with no drills yet. Chips render only
    sports present in DRILLS; icons come from here. */
export const SPORT_META: Record<string, { icon: string }> = {
  "Baseball": { icon: "⚾" },
  "Basketball": { icon: "🏀" },
  "Football": { icon: "🏈" },
  "Soccer": { icon: "⚽" },
  "Softball": { icon: "🥎" },
  "Tennis": { icon: "🎾" },
  "Track": { icon: "🏃" },
  "Volleyball": { icon: "🏐" },
  "Wrestling": { icon: "🤼" },
};

export function coachFor(drill: Drill): DrillCoach {
  // The generator guarantees every coachId resolves.
  return COACHES.find(c => c.id === drill.coachId)!;
}
