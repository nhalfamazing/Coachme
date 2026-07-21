// @ts-nocheck
// CoachMe 3-word login codes.
//
// Format:  athlete  ->  firstname-word-word   (alex-tiger-moon)
//          coach    ->  name-coach-word       (sam-coach-tiger)
//
// Word 1 is the person's own first name. The other words quietly encode
// sport, age, and position plus a random tag so every code is different.
// Codes are stored on the profile the moment they are issued, so on any
// device that has seen this person the code restores their exact full
// profile. On a brand-new device the words alone rebuild a working
// profile (name, sport, age, position). Old long codes (CM1/CM2/CH1/CH2)
// still decode so nobody gets locked out.

export const SPORTS_CANON = [
  'Baseball', 'Basketball', 'Football', 'Soccer',
  'Tennis', 'Track', 'Volleyball', 'Wrestling',
];

export const POSITIONS_CANON = {
  Baseball: ['Pitcher', 'Catcher', '1st Base', '2nd Base', '3rd Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Utility'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Safety', 'Cornerback', 'Kicker', 'Punter'],
  Soccer: ['Goalkeeper', 'Center Back', 'Fullback', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Winger', 'Striker'],
  Tennis: ['Singles', 'Doubles', 'Both'],
  Track: ['Sprints', 'Middle Distance', 'Long Distance', 'Hurdles', 'Throws', 'Jumps', 'Multi-Events'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter', 'Libero', 'Defensive Specialist'],
  Wrestling: ['Wrestler'],
};

// 190 words: encodes sport (9 buckets incl. custom) x age (21 buckets).
const WORDS_A = [
  'tiger', 'lion', 'bear', 'wolf', 'fox', 'hawk', 'eagle', 'shark', 'whale', 'seal',
  'otter', 'moose', 'elk', 'deer', 'bison', 'horse', 'pony', 'mule', 'goat', 'sheep',
  'lamb', 'calf', 'bull', 'crab', 'squid', 'ray', 'trout', 'bass', 'perch', 'carp',
  'pike', 'cod', 'sole', 'tuna', 'moth', 'bee', 'wasp', 'ant', 'beetle', 'cricket',
  'frog', 'toad', 'newt', 'gecko', 'iguana', 'cobra', 'viper', 'boa', 'lizard', 'turtle',
  'raven', 'crow', 'robin', 'finch', 'wren', 'owl', 'swan', 'goose', 'duck', 'heron',
  'crane', 'stork', 'ibis', 'gull', 'tern', 'puffin', 'parrot', 'macaw', 'toucan', 'dove',
  'pigeon', 'quail', 'plover', 'jay', 'magpie', 'lark', 'swift', 'swallow', 'falcon', 'kestrel',
  'red', 'blue', 'green', 'gold', 'silver', 'black', 'white', 'gray', 'pink', 'teal',
  'cyan', 'navy', 'plum', 'rose', 'ruby', 'coral', 'amber', 'jade', 'pearl', 'onyx',
  'topaz', 'opal', 'agate', 'flint', 'slate', 'stone', 'rock', 'cliff', 'hill', 'peak',
  'ridge', 'valley', 'canyon', 'mesa', 'dune', 'beach', 'shore', 'coast', 'reef', 'cove',
  'bay', 'lake', 'pond', 'river', 'creek', 'brook', 'falls', 'rapids', 'spring', 'geyser',
  'cloud', 'storm', 'rain', 'snow', 'hail', 'sleet', 'frost', 'ice', 'mist', 'fog',
  'wind', 'breeze', 'gale', 'gust', 'sun', 'moon', 'star', 'comet', 'meteor', 'nova',
  'orbit', 'cosmos', 'nebula', 'galaxy', 'planet', 'mars', 'venus', 'pluto', 'saturn', 'mercury',
  'maple', 'oak', 'pine', 'cedar', 'birch', 'aspen', 'willow', 'elm', 'ash', 'fir',
  'spruce', 'palm', 'fern', 'moss', 'ivy', 'vine', 'clover', 'daisy', 'lily', 'tulip',
  'poppy', 'iris', 'lotus', 'orchid', 'violet', 'sage', 'mint', 'basil', 'thyme', 'dill',
];

// 250 words: encodes position (13 buckets) x tag (19) for athletes, or
// sport (9) x tag (27) for coaches.
const WORDS_B = [
  'jump', 'run', 'dash', 'sprint', 'leap', 'dive', 'swim', 'climb', 'race', 'chase',
  'throw', 'catch', 'kick', 'punt', 'pass', 'shoot', 'score', 'win', 'rally', 'drill',
  'block', 'tackle', 'swing', 'pitch', 'slide', 'steal', 'hustle', 'jog', 'flip', 'spin',
  'twist', 'roll', 'tumble', 'vault', 'dodge', 'weave', 'pivot', 'lunge', 'squat', 'plank',
  'apple', 'mango', 'peach', 'pear', 'grape', 'lemon', 'lime', 'melon', 'berry', 'cherry',
  'kiwi', 'fig', 'date', 'olive', 'corn', 'bean', 'pea', 'kale', 'leek', 'onion',
  'carrot', 'radish', 'turnip', 'squash', 'yam', 'taco', 'pizza', 'bagel', 'waffle', 'pancake',
  'muffin', 'cookie', 'brownie', 'donut', 'pretzel', 'popcorn', 'nacho', 'salsa', 'queso', 'churro',
  'bright', 'brave', 'bold', 'calm', 'clever', 'daring', 'eager', 'fair', 'fast', 'fierce',
  'gentle', 'grand', 'happy', 'jolly', 'keen', 'kind', 'lively', 'loyal', 'lucky', 'mighty',
  'noble', 'plucky', 'proud', 'quick', 'quiet', 'rapid', 'ready', 'sharp', 'shiny', 'smart',
  'snappy', 'solid', 'speedy', 'spry', 'steady', 'strong', 'sturdy', 'sunny', 'super', 'tough',
  'vivid', 'wild', 'witty', 'zesty', 'zippy', 'drum', 'flute', 'horn', 'banjo', 'cello',
  'piano', 'viola', 'chime', 'bell', 'gong', 'anchor', 'sail', 'mast', 'oar', 'rudder',
  'kayak', 'canoe', 'raft', 'sled', 'wagon', 'cart', 'scooter', 'skate', 'cycle', 'glider',
  'rocket', 'jet', 'plane', 'blimp', 'glove', 'helmet', 'jersey', 'cleat', 'whistle', 'medal',
  'trophy', 'banner', 'flag', 'badge', 'crown', 'shield', 'lance', 'arrow', 'bow', 'quiver',
  'hammer', 'anvil', 'chisel', 'wrench', 'pliers', 'magnet', 'prism', 'lens', 'scope', 'radar',
  'laser', 'pixel', 'robot', 'gadget', 'widget', 'sprocket', 'gear', 'coil', 'lever', 'pulley',
  'candle', 'lantern', 'torch', 'ember', 'spark', 'blaze', 'flame', 'glow', 'shimmer', 'gleam',
  'pebble', 'boulder', 'crystal', 'quartz', 'marble', 'granite', 'copper', 'bronze', 'iron', 'steel',
  'cotton', 'denim', 'wool', 'silk', 'velvet', 'ribbon', 'thread', 'button', 'zipper', 'pocket',
  'ladder', 'bridge', 'tunnel', 'tower', 'castle', 'fort', 'cabin', 'tent', 'igloo', 'dome',
  'north', 'south', 'east', 'west', 'compass', 'atlas', 'map', 'trail', 'path', 'quest',
  'puzzle', 'riddle', 'secret', 'magic', 'wonder', 'dream', 'spirit', 'legend', 'hero', 'champ',
];

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function sanitizeNameWord(s) {
  const w = String(s || '').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  return w || 'player';
}

export function normalizeCode(input) {
  return String(input || '')
    .trim().toLowerCase()
    .replace(/[\s._,/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Deterministic id from the code so the same code always means the same
// person, on every device.
function codeHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h) + 100000;
}

function randomOrder(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateAthleteCode(a, existingCodes = []) {
  try {
    const first = sanitizeNameWord(a.firstName || a.name);
    const si = SPORTS_CANON.indexOf(a.sport) === -1 ? 8 : SPORTS_CANON.indexOf(a.sport);
    const age = Number(a.age);
    const ageIdx = Number.isFinite(age) && age >= 6 && age <= 25 ? age - 6 : 20;
    const w2 = WORDS_A[si * 21 + ageIdx];
    const posList = POSITIONS_CANON[a.sport] || [];
    let posIdx = posList.indexOf(a.position);
    if (posIdx < 0 || posIdx > 11) posIdx = 12;
    const taken = new Set(existingCodes.filter(Boolean));
    let code = null;
    for (const tag of randomOrder(19)) {
      const candidate = `${first}-${w2}-${WORDS_B[posIdx * 19 + tag]}`;
      code = candidate;
      if (!taken.has(candidate)) break;
    }
    return code;
  } catch {
    return null;
  }
}

export function generateCoachCode(c, existingCodes = []) {
  try {
    const first = sanitizeNameWord(c.name);
    const si = SPORTS_CANON.indexOf(c.sport) === -1 ? 8 : SPORTS_CANON.indexOf(c.sport);
    const taken = new Set(existingCodes.filter(Boolean));
    let code = null;
    for (const tag of randomOrder(27)) {
      const candidate = `${first}-coach-${WORDS_B[si * 27 + tag]}`;
      code = candidate;
      if (!taken.has(candidate)) break;
    }
    return code;
  } catch {
    return null;
  }
}

function legacyDecodeAthlete(raw) {
  try {
    if (raw.toUpperCase().startsWith('CM2-')) {
      const p = raw.slice(4).split('.');
      const id = parseInt(p[0], 36);
      const firstName = titleCase(String(p[1] || '').replace(/_/g, ' ').trim());
      const sport = titleCase(String(p[3] || '').replace(/_/g, ' ').trim());
      if (!id || !firstName || !sport) return null;
      const lastName = titleCase(String(p[2] || '').replace(/_/g, ' ').trim());
      const position = titleCase(String(p[4] || '').replace(/_/g, ' ').trim());
      const age = p[5] ? parseInt(p[5]) : null;
      const city = titleCase(String(p[6] || '').replace(/_/g, ' ').trim());
      const state = String(p[7] || '').replace(/_/g, ' ').trim().toUpperCase();
      return {
        id, firstName, lastName: lastName || null,
        name: lastName ? `${firstName[0]}. ${lastName}` : firstName,
        initials: (firstName[0] + (lastName?.[0] || firstName[1] || '')).toUpperCase(),
        sport, position: position || '',
        age: Number.isFinite(age) ? age : null,
        city, state,
        location: city ? `${city}${state ? `, ${state}` : ''}` : '',
        banner: sport === 'Baseball' ? '/banner.jpg' : null,
        photo: null, stats: [], level: 1, xp: 0, xpMax: 500,
      };
    }
    if (!raw.startsWith('CM1-')) return null;
    const a = JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))));
    if (!a || !a.id || !a.name || !a.sport || !a.initials) return null;
    return a;
  } catch { return null; }
}

function legacyDecodeCoach(raw) {
  try {
    if (raw.toUpperCase().startsWith('CH2-')) {
      const p = raw.slice(4).split('.');
      const id = parseInt(p[0], 36);
      const name = String(p[1] || '').replace(/_/g, ' ').trim();
      const sport = titleCase(String(p[2] || '').replace(/_/g, ' ').trim());
      if (!id || !name || !sport) return null;
      const specialty = String(p[3] || '').replace(/_/g, ' ').trim();
      const rate = p[4] ? parseFloat(p[4]) : null;
      const years = p[5] ? parseInt(p[5]) : null;
      const city = titleCase(String(p[6] || '').replace(/_/g, ' ').trim());
      const words = name.split(' ');
      return {
        id, name, sport,
        initials: ((words[0]?.[0] || '') + (words[1]?.[0] || words[0]?.[1] || '')).toUpperCase(),
        specialty, title: specialty, rate, years,
        location: city || '',
        photo: null, cover: null, rating: null, reviews: 0, athletes: 0,
        avgGain: null, commits: 0, modes: ['in_person'],
        badge: 'NEW COACH', bio: '', color: '#5DA9FF',
        email: '', phone: '', verified: false,
      };
    }
    if (!raw.startsWith('CH1-')) return null;
    const c = JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))));
    if (!c || !c.id || !c.name || !c.sport) return null;
    return c;
  } catch { return null; }
}

// The one decoder every login box uses. Local profiles win (exact full
// restore); otherwise the words rebuild a working profile.
export function decodeAnyCode(input, { athletes = [], coaches = [] } = {}) {
  const rawTrimmed = String(input || '').trim().replace(/\s+/g, '');
  // Legacy long codes keep working forever.
  const up = rawTrimmed.toUpperCase();
  if (up.startsWith('CM1-') || up.startsWith('CM2-')) {
    const profile = legacyDecodeAthlete(rawTrimmed);
    return profile ? { type: 'athlete', profile, isLocal: false } : null;
  }
  if (up.startsWith('CH1-') || up.startsWith('CH2-')) {
    const profile = legacyDecodeCoach(rawTrimmed);
    return profile ? { type: 'coach', profile, isLocal: false } : null;
  }

  const code = normalizeCode(input);
  if (!code) return null;

  // Known on this device? Exact profile, exactly as they left it.
  const localAthlete = athletes.find(a => a && a.code === code);
  if (localAthlete) return { type: 'athlete', profile: { level: 1, xp: 0, xpMax: 500, ...localAthlete }, isLocal: true };
  const localCoach = coaches.find(c => c && c.code === code);
  if (localCoach) return { type: 'coach', profile: localCoach, isLocal: true };

  const parts = code.split('-');
  if (parts.length !== 3) return null;
  const [w1, w2, w3] = parts;
  const firstName = titleCase(w1.replace(/[^a-z]/g, ''));
  if (!firstName) return null;

  if (w2 === 'coach') {
    const i3 = WORDS_B.indexOf(w3);
    if (i3 < 0) return null;
    const si = Math.min(8, Math.floor(i3 / 27));
    const sport = SPORTS_CANON[si] || 'Other';
    return {
      type: 'coach',
      isLocal: false,
      profile: {
        id: codeHash(code), code, name: firstName, sport,
        initials: (firstName[0] + (firstName[1] || '')).toUpperCase(),
        specialty: `${sport} coaching`, title: `${sport} coaching`,
        rate: null, years: null, location: '',
        photo: null, cover: null, rating: null, reviews: 0, athletes: 0,
        avgGain: null, commits: 0, modes: ['in_person'],
        badge: 'NEW COACH', bio: '', color: '#5DA9FF',
        email: '', phone: '', verified: false,
      },
    };
  }

  const i2 = WORDS_A.indexOf(w2);
  const i3 = WORDS_B.indexOf(w3);
  if (i2 < 0 || i3 < 0) return null;
  const si = Math.min(8, Math.floor(i2 / 21));
  const ageIdx = i2 % 21;
  const sport = SPORTS_CANON[si] || 'Other';
  const posIdx = Math.min(12, Math.floor(i3 / 19));
  const position = (POSITIONS_CANON[sport] || [])[posIdx] || '';
  return {
    type: 'athlete',
    isLocal: false,
    profile: {
      id: codeHash(code), code,
      firstName, lastName: null, name: firstName,
      initials: (firstName[0] + (firstName[1] || '')).toUpperCase(),
      sport, position,
      age: ageIdx < 20 ? ageIdx + 6 : null,
      city: '', state: '', location: '',
      banner: sport === 'Baseball' ? '/banner.jpg' : null,
      photo: null, stats: [], level: 1, xp: 0, xpMax: 500,
    },
  };
}
