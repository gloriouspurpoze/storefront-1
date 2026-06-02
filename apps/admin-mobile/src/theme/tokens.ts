/**
 * Fixer brand system — TypeScript tokens.
 *
 * SINGLE SOURCE OF TRUTH: `apps/admin-mobile/DESIGN.md`.
 * Every value in this file maps 1:1 to a DESIGN.md token. Do not introduce
 * raw hex / px values in components — extend this file instead.
 */

export const palette = {
  // Brand & accent
  primary: '#00142F',
  secondary: '#FE9D16',
  onPrimary: '#FFFFFF',
  onSecondary: '#00142F',
  ink: '#00142F',
  body: '#4B5563',
  mute: '#8B95A5',
  hairlineMid: '#6B7280',

  // Surface
  canvas: '#FFFFFF',
  canvasSoft: '#F4F6F9',
  canvasSofter: '#EEF1F6',
  surfacePressed: '#E2E6ED',

  // Misc
  link: '#FE9D16',
  onDark: '#FFFFFF',
  blackElevated: '#0A1F3D',
  primarySoft: 'rgba(0, 20, 47, 0.08)',
  secondarySoft: 'rgba(254, 157, 22, 0.14)',

  // Semantic — extended for app-specific states
  // (DESIGN.md defers semantic to brand primary; we add the standard trio
  // for status badges, error states, etc. while keeping them muted enough
  // not to fight the navy + amber duet.)
  success: '#0F9D58',
  warning: '#F59E0B',
  danger: '#D93025',
  successSoft: 'rgba(15, 157, 88, 0.10)',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  dangerSoft: 'rgba(217, 48, 37, 0.10)',
} as const

export type PaletteToken = keyof typeof palette

/**
 * Spacing scale — base 4px. Mirrors DESIGN.md `spacing` keys.
 */
export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export type SpacingToken = keyof typeof spacing

/**
 * Border radius scale.
 */
export const radius = {
  none: 0,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  pillTab: 36,
  full: 9999,
} as const

export type RadiusToken = keyof typeof radius

/**
 * Typography scale. `fontFamily` is undefined to fall back to the platform
 * default (UberMove is proprietary; per DESIGN.md the supported substitutes
 * are Inter / Plus Jakarta Sans, which we'll wire in once fonts are bundled).
 */
export const typography = {
  displayXxl: { fontSize: 52, fontWeight: '700', lineHeight: 64 },
  displayXl: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
  displayLg: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  displayMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  displaySm: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  bodyLg: { fontSize: 18, fontWeight: '500', lineHeight: 24 },
  bodyMd: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMdStrong: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
  bodySm: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmStrong: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  buttonLarge: { fontSize: 18, fontWeight: '500', lineHeight: 24 },
  buttonMd: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
} as const

export type TypographyToken = keyof typeof typography

/**
 * Elevation tokens — DESIGN.md Levels 0-3.
 * Native shadow on iOS, elevation on Android.
 */
export const elevation = {
  flat: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pillFloat: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
} as const

export type ElevationToken = keyof typeof elevation

/**
 * Touch-target minimums (WCAG AAA per DESIGN.md §Responsive Strategy).
 */
export const hitTarget = {
  min: 44,
  comfortable: 48,
  large: 56,
} as const
