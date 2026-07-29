# KoachMe design system: the scouting report

The product truth is "stats that say how they were verified." The visual
language is the stat sheet come alive: measurement ticks, verification
stamps, oversized jersey numerals, field geometry. Sports-functional
micrographics, never decoration for its own sake.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--km-bg` | `#0A0A0B` | Page base. |
| `--km-raised` | `#111113` | Raised sections/strips. |
| `--km-card` | `#17181A` | Cards. |
| `--km-high` | `#1E1F23` | Hover / highest surfaces. |
| `--km-chalk` | `#F2EFE6` | Primary text. Field-line white, slightly warm. Never pure `#FFF`. |
| `--km-chalk-dim` | 62% chalk | Secondary text. |
| `--km-lime` | `#C5FF3D` | THE action color: CTAs, live states. An accent used everywhere is an accent nowhere - aim for 2-3 lime elements per viewport. |
| `--km-clay` | `#C96F4A` | EARNED only: verification and trust moments (verified badges, coach-verified stats, disclosure stamps). Clay = earned on the field. Never decorative. |

Depth comes from surface steps, not shadows.

## Type

| Role | Family | Class | Rules |
| --- | --- | --- | --- |
| Display | Clash Display 600/700 (Fontshare FFL, self-hosted) | `.display` | Headlines. Viewport-scaled via clamp on hero. Speed/motion beats may use a skewed variant (Clash has no italics; use `transform: skewX(-6deg)` on short display lines only). |
| Wide | Panchang 600 (Fontshare FFL, self-hosted) | `.wide` | Eyebrows, labels, section markers, stamps. Uppercase, 0.14em+ tracking. The swagger layer. |
| Body | Archivo variable (width axis) | `.body` | Prose at normal width; condensed (`font-stretch: 87.5%`) for dense stat contexts only. |
| Data | JetBrains Mono | `.mono` | Numbers and stats ONLY. The stat-sheet voice. Not for prose, not for labels (labels are Panchang now). |

Bebas Neue and Manrope are gone. Do not reintroduce them.

## Signature elements

- **Stamp** (`.stamp`, variants `--lime --clay --r --flat`): rubber-stamp
  chip - Panchang, 1px `currentColor` border, ±1.5° rotation. Replaces
  every generic pill badge: stat provenance (SELF REPORTED / COACH
  VERIFIED in clay), AI disclosures (AI DEMO), section eyebrows.
- **Field geometry** (`FieldGeo` in `components/marketing/field-lines.tsx`):
  thin-stroke court/field SVGs at 3-6% chalk. Each landing section uses a
  DIFFERENT sport. Landing only.
- **Giant numerals** (`.mk-numeral`): jersey-number motif, 4-6% chalk,
  JetBrains Mono, bleeding off section edges. Only numbers that mean
  something: step indexes, the real drill count, the real 90% take.
- **Grain** (`.mk-grain` on the landing page wrapper): SVG turbulence at
  4% overlay. Landing only - never the app.
- **Halftone** (`.mk-halftone`): dot screen over product screenshots.
- **Ticker** (`.mk-ticker`): one kinetic marquee, sports covered, pauses
  on hover.

## Restraint rules

1. Max ONE giant numeral per viewport height.
2. A section gets field geometry OR a numeral, never both.
3. Grain on the landing page only. The app inherits voice, not costume:
   type stack + surface steps + stamps, NO grain/geometry/numerals.
4. Before committing a section, remove one decorative element.
5. Lime: if more than ~3 lime moments are visible in a viewport, demote
   some to chalk.

## Accessibility floors

Chalk on bg: ~16.5:1. Lime on bg: ~14:1. Clay on bg: ~5.2:1 - passes AA
for normal text; keep clay stamps at >=9px with 0.14em tracking and
never use clay below 9px. Focus states: 2px lime outline, 2px offset.
