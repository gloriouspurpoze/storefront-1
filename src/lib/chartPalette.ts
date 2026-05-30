/**
 * Chart palette — projection of DESIGN.md tokens for JS-side usage
 * (recharts `fill` / `stroke` / `color` props that can't read Tailwind classes).
 *
 * NEVER hardcode another chart color anywhere in the codebase.
 * If you need a new chart color, add the token to DESIGN.md first, mirror it
 * into src/index.css + tailwind.config.js, then add it here.
 *
 * Naming follows DESIGN.md hex tokens exactly.
 */
export const CHART_PALETTE = {
  // Primary HP Electric Blue family
  primary: '#024ad8',
  primaryBright: '#296ef9',
  primaryDeep: '#0e3191',
  primarySoft: '#c9e0fc',

  // Ink scale (use for axis lines, labels, gridlines)
  ink: '#1a1a1a',
  inkSoft: '#292929',
  charcoal: '#3d3d3d',
  graphite: '#636363',
  steel: '#c2c2c2',
  hairline: '#e8e8e8',
  cloud: '#f7f7f7',
  canvas: '#ffffff',

  // Bloom family (sale / warning / destructive)
  bloomCoral: '#ff5050',
  bloomRose: '#f9d4d2',
  bloomDeep: '#b3262b',
  bloomWine: '#5a1313',

  // Storm family (neutral positive / infographic accents)
  stormMist: '#8ebdce',
  stormSea: '#7fadbe',
  stormDeep: '#356373',
} as const

/**
 * Semantic chart roles. Each maps to a DESIGN.md token — pick by intent, not hex.
 */
export const CHART_TOKENS = {
  primary: CHART_PALETTE.primary,
  secondary: CHART_PALETTE.primaryDeep,
  success: CHART_PALETTE.stormDeep,
  warning: CHART_PALETTE.bloomCoral,
  destructive: CHART_PALETTE.bloomDeep,
  info: CHART_PALETTE.primaryBright,
  neutral: CHART_PALETTE.graphite,
  /** Axis lines, label color */
  axis: CHART_PALETTE.graphite,
  /** Grid line color */
  grid: CHART_PALETTE.hairline,
  /** Tooltip background */
  surface: CHART_PALETTE.canvas,
  /** Tooltip ink */
  ink: CHART_PALETTE.ink,
} as const

/**
 * Categorical multi-series rotation (e.g. pie / stacked bar). Picks DESIGN.md
 * tokens in an order that maintains contrast and avoids the "rainbow" feel.
 */
export const CHART_CATEGORICAL = [
  CHART_PALETTE.primary,
  CHART_PALETTE.stormDeep,
  CHART_PALETTE.bloomCoral,
  CHART_PALETTE.primaryDeep,
  CHART_PALETTE.bloomDeep,
  CHART_PALETTE.stormMist,
  CHART_PALETTE.charcoal,
  CHART_PALETTE.primaryBright,
] as const
