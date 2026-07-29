// Progress-proof chart for the landing page: one metric trending up
// across eight weeks. INTEGRITY: this is illustrative SAMPLE data and
// carries a SAMPLE DATA stamp on the card - we have no real user
// numbers to show and we do not fake them. Server component, no JS.

const WEEKS = [11, 12, 14, 13, 16, 17, 17, 19];
const METRIC_MAX = 25;

// Chart box inside the svg viewBox.
const X0 = 34, X1 = 526, Y0 = 26, Y1 = 196;
const VLO = 10, VHI = 20;

function pt(i: number, v: number): [number, number] {
  const x = X0 + (i * (X1 - X0)) / (WEEKS.length - 1);
  const y = Y1 - ((v - VLO) * (Y1 - Y0)) / (VHI - VLO);
  return [x, y];
}

export function ProgressProof() {
  const points = WEEKS.map((v, i) => pt(i, v));
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const first = WEEKS[0];
  const last = WEEKS[WEEKS.length - 1];

  return (
    <div className="mk-card mk-proof-card">
      <div className="mk-proof-head">
        <span className="stamp stamp--flat">Sample data</span>
        <span className="mk-proof-metric mono">
          Free throws made / {METRIC_MAX} &middot; 8 weeks
        </span>
      </div>
      <svg
        className="mk-proof-chart"
        viewBox="0 0 560 240"
        role="img"
        aria-label={`Sample progress chart: free throws made out of ${METRIC_MAX} rising from ${first} to ${last} across eight weeks of logged training`}
      >
        {/* horizontal hairlines at 10 / 15 / 20 */}
        {[10, 15, 20].map(v => {
          const [, y] = pt(0, v);
          return (
            <g key={v}>
              <line x1={X0} y1={y} x2={X1} y2={y} stroke="var(--km-line)" strokeWidth="1" />
              <text x={X0 - 8} y={y + 3} textAnchor="end" className="mono mk-proof-axis">{v}</text>
            </g>
          );
        })}
        {/* the metric line */}
        <polyline points={line} fill="none" stroke="#C5FF3D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? "#C5FF3D" : "#0A0A0B"} stroke="#C5FF3D" strokeWidth="2" />
        ))}
        {/* end value, stat-sheet voice */}
        <text x={X1 - 2} y={pt(WEEKS.length - 1, last)[1] - 14} textAnchor="end" className="mono mk-proof-end">{last}</text>
        {/* week labels */}
        {WEEKS.map((_, i) => (
          <text key={i} x={pt(i, VLO)[0]} y={222} textAnchor="middle" className="mono mk-proof-axis">
            W{i + 1}
          </text>
        ))}
      </svg>
      <div className="mk-proof-chips mono" aria-label="Sample streak and XP counters">
        <span className="mk-proof-chip">Streak &middot; 14 days</span>
        <span className="mk-proof-chip">XP &middot; 2,450</span>
        <span className="mk-proof-chip mk-proof-chip--up">+{last - first} in 8 weeks</span>
      </div>
    </div>
  );
}
