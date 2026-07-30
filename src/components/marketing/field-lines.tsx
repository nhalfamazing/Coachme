/* Field geometry: thin-stroke court/field elements drawn as inline SVG,
   used at 3-6% chalk opacity as section backgrounds. Subject-grounded
   page furniture - on the landing page each section borrows lines from a
   DIFFERENT sport (see docs/design-system.md); the in-app drill detail
   page uses the geometry of the drill's OWN sport, one per screen.
   Pure render, no hooks - safe to import from client components too.

   All strokes use currentColor; the wrapper sets color + opacity, so
   every element stays a one-liner to place:
     <FieldGeo sport="basketball" style={{ right: -120, top: -40 }} />

   The wrapper's .mk-geo positioning class lives in marketing.css for
   the landing page; the app declares its own copy in page.tsx (it does
   not load marketing.css). */

const STROKE = 1.25;

function BasketballKey() {
  // Free-throw key + arc, portrait orientation.
  return (
    <svg width="420" height="520" viewBox="0 0 420 520" fill="none" aria-hidden="true">
      <rect x="90" y="0" width="240" height="290" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="210" cy="290" r="92" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M 30 0 A 265 265 0 0 0 390 0" stroke="currentColor" strokeWidth={STROKE} transform="translate(0 8) scale(1 -1) translate(0 -16)" />
      <circle cx="210" cy="60" r="12" stroke="currentColor" strokeWidth={STROKE} />
    </svg>
  );
}

function FootballHashes() {
  // Yard lines with inboard hash marks.
  return (
    <svg width="560" height="360" viewBox="0 0 560 360" fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i} transform={`translate(${i * 130} 0)`}>
          <line x1="0" y1="0" x2="0" y2="360" stroke="currentColor" strokeWidth={STROKE} />
          {[40, 90, 140, 190, 240, 290].map(y => (
            <line key={y} x1="-9" y1={y} x2="9" y2={y} stroke="currentColor" strokeWidth={STROKE} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function TrackLanes() {
  // Curved lane lines entering a straight.
  return (
    <svg width="620" height="330" viewBox="0 0 620 330" fill="none" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <path
          key={i}
          d={`M 0 ${330 - i * 44} Q 300 ${310 - i * 44} 620 ${96 - i * 30}`}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      ))}
    </svg>
  );
}

function BaseballInfield() {
  // Diamond with basepaths and the pitching rubber.
  return (
    <svg width="480" height="480" viewBox="0 0 480 480" fill="none" aria-hidden="true">
      <path d="M 240 440 L 60 260 L 240 80 L 420 260 Z" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M 150 350 A 128 128 0 0 1 330 350" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="225" y="255" width="30" height="7" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="231" y="431" width="18" height="18" stroke="currentColor" strokeWidth={STROKE} transform="rotate(45 240 440)" />
    </svg>
  );
}

function SoccerCircle() {
  // Center circle + halfway line + kickoff mark.
  return (
    <svg width="560" height="330" viewBox="0 0 560 330" fill="none" aria-hidden="true">
      <line x1="0" y1="165" x2="560" y2="165" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="280" cy="165" r="110" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="280" cy="165" r="3" fill="currentColor" />
    </svg>
  );
}

function VolleyballCourt() {
  // Court outline with the net line and both attack lines.
  return (
    <svg width="520" height="360" viewBox="0 0 520 360" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="480" height="320" stroke="currentColor" strokeWidth={STROKE} />
      <line x1="260" y1="20" x2="260" y2="340" stroke="currentColor" strokeWidth={STROKE} />
      <line x1="164" y1="20" x2="164" y2="340" stroke="currentColor" strokeWidth={STROKE} />
      <line x1="356" y1="20" x2="356" y2="340" stroke="currentColor" strokeWidth={STROKE} />
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <line key={i} x1="260" y1={20 + i * 53} x2="260" y2={20 + i * 53 + 26} stroke="currentColor" strokeWidth={STROKE * 2.4} />
      ))}
    </svg>
  );
}

function SoftballInfield() {
  // Diamond with basepaths and the pitching circle (softball pitches
  // from a flat circle, not a raised mound — that is the tell).
  return (
    <svg width="480" height="480" viewBox="0 0 480 480" fill="none" aria-hidden="true">
      <path d="M 240 440 L 72 272 L 240 104 L 408 272 Z" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M 158 358 A 116 116 0 0 1 322 358" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="240" cy="272" r="34" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="231" y="431" width="18" height="18" stroke="currentColor" strokeWidth={STROKE} transform="rotate(45 240 440)" />
    </svg>
  );
}

const SPORTS = {
  basketball: BasketballKey,
  football: FootballHashes,
  track: TrackLanes,
  baseball: BaseballInfield,
  soccer: SoccerCircle,
  volleyball: VolleyballCourt,
  softball: SoftballInfield,
} as const;

/** Sports this component can draw. Callers with a dynamic sport (the
    drill detail page keys off the drill's sport) narrow through this
    instead of casting — an unsupported sport renders no geometry. */
export type FieldGeoSport = keyof typeof SPORTS;
export function hasFieldGeo(sport: string): sport is FieldGeoSport {
  return sport in SPORTS;
}

export function FieldGeo({
  sport,
  opacity = 0.05,
  style,
}: {
  sport: FieldGeoSport;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  const Lines = SPORTS[sport];
  return (
    <div className="mk-geo" aria-hidden="true">
      <div style={{ position: "absolute", color: "var(--km-chalk)", opacity, ...style }}>
        <Lines />
      </div>
    </div>
  );
}
