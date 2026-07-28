/* Drill Library: AI-generated coach clips (made with the founder's
   Higgsfield account; same coach character in every clip). Each drill
   has an intro (coach speaks) and a demo (slow textbook rep). Clearly
   labeled as AI in the UI.

   Every asset carries two URLs:
   - cdn:  the original Higgsfield CloudFront link, kept as the fallback
           reference / re-mirror source ONLY. Those links can rotate or
           die without warning — never serve them from the app.
   - blob: our own mirrored copy on Vercel Blob (uploaded once by
           scripts/mirror-drills.mjs). This is what the player serves. */

export type DrillSport = 'Basketball' | 'Soccer' | 'Baseball';

export interface DrillAsset {
  /** Original Higgsfield CloudFront URL — fallback reference only. */
  cdn: string;
  /** Our mirrored copy on Vercel Blob — what the app serves. */
  blob: string;
}

export interface Drill {
  id: string;
  sport: DrillSport;
  title: string;
  cue: string;
  intro: DrillAsset;
  demo: DrillAsset;
  poster: DrillAsset;
}

/* Real store base, from the first scripts/mirror-drills.mjs run
   (2026-07-27: 18 objects, 88.5 MB, zero failures). */
export const DRILL_BLOB_BASE =
  'https://woooi7wpsmvhydy9.public.blob.vercel-storage.com';

const CDN =
  'https://d8j0ntlcm91z4.cloudfront.net/user_3EtZhOwg7pbdjJOUJ7nU0ZlzLCS/';

/* Poster stills are shared per sport on the CDN; in Blob each drill gets
   its own copy under drills/<id>/poster.png so the pathname layout stays
   uniform. Sources are PNGs, so the mirrored files keep the .png
   extension. */
const POSTER_CDN: Record<DrillSport, string> = {
  Basketball: CDN + 'hf_20260723_003605_9fbc7e25-4227-468f-a09a-e6658825dba0.png',
  Soccer: CDN + 'hf_20260723_005814_88206a71-adb4-4295-9ccb-66f72ce85f79.png',
  Baseball: CDN + 'hf_20260723_005819_0cc507c8-0f65-4461-9fb9-0f4c32f908a7.png',
};

function makeDrill(
  id: string,
  sport: DrillSport,
  title: string,
  cue: string,
  introFile: string,
  demoFile: string,
): Drill {
  return {
    id,
    sport,
    title,
    cue,
    intro: { cdn: CDN + introFile, blob: `${DRILL_BLOB_BASE}/drills/${id}/intro.mp4` },
    demo: { cdn: CDN + demoFile, blob: `${DRILL_BLOB_BASE}/drills/${id}/demo.mp4` },
    poster: { cdn: POSTER_CDN[sport], blob: `${DRILL_BLOB_BASE}/drills/${id}/poster.png` },
  };
}

export const DRILLS: Drill[] = [
  makeDrill(
    'bb-crossover', 'Basketball', 'Crossover Dribble',
    'Stay low, keep the ball below your knees, snap it across your body.',
    'hf_20260723_005010_50b1a8b7-176c-4769-83a5-84d548b43193.mp4',
    'hf_20260723_005024_03687e08-51b3-46c7-971c-db1eb40f0885.mp4',
  ),
  makeDrill(
    'bb-form-shooting', 'Basketball', 'Form Shooting',
    'One hand, perfect release, hold your follow-through.',
    'hf_20260723_010030_c8f4cc7c-f80c-45f3-bfdd-696672975daa.mp4',
    'hf_20260723_010037_17fbac40-451b-4456-9aa1-b3bb3021ac4a.mp4',
  ),
  makeDrill(
    'so-inside-pass', 'Soccer', 'Inside-Foot Pass',
    'Plant foot points at your target, strike the middle of the ball, firm ankle.',
    'hf_20260723_010043_7e65c1db-3c44-4bc2-b5d6-942ad083bdcd.mp4',
    'hf_20260723_010051_03fe3035-a7ea-417f-97cc-d79481d65ed3.mp4',
  ),
  makeDrill(
    'so-first-touch', 'Soccer', 'First Touch',
    'Meet the ball, cushion it soft, push it one step into space.',
    'hf_20260723_010057_6bcc39f8-5cd0-4edf-a583-6e80f501016a.mp4',
    'hf_20260723_010102_d75cd1f4-7c2c-42cf-8ba6-cf114d704b62.mp4',
  ),
  makeDrill(
    'ba-tee-work', 'Baseball', 'Tee Work',
    'Balanced stance, short stride, hands take the barrel straight to the ball.',
    'hf_20260723_010109_4cb2b3ae-97a2-427f-91a0-656b2dad870f.mp4',
    'hf_20260723_010115_b6969706-8ef9-4e7e-b75d-94a6110f73bf.mp4',
  ),
  makeDrill(
    'ba-ready-position', 'Baseball', 'Fielding Ready Position',
    'Feet wide, butt down, glove out front where you can see it.',
    'hf_20260723_010121_3000a2d9-82c3-4a3b-938b-5695173150b5.mp4',
    'hf_20260723_010128_fb22663c-6dce-4d51-ab3a-5a1fd1cb8dd5.mp4',
  ),
];
