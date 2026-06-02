/**
 * @deprecated — use `import { palette } from '@/theme'` instead.
 *
 * This file is kept as a back-compat shim while we migrate every screen to
 * the DESIGN.md tokens. New code should never import from here.
 */
import { palette } from './tokens'

export const colors = {
  background: palette.canvas,
  surface: palette.canvasSoft,
  surfaceElevated: palette.canvas,
  border: palette.surfacePressed,
  text: palette.ink,
  textMuted: palette.body,
  primary: palette.primary,
  primaryMuted: palette.blackElevated,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
} as const
