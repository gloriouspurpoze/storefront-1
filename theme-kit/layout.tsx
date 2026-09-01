import type { ReactNode } from 'react'
import {
  isPrivateLayoutTheme,
  renderPrivateLayout,
  type PrivateLayoutRenderArgs,
  type PrivateVerticalKey,
} from '@/themes/private/registry'

/**
 * Builds a `{Vertical}LayoutPage` component + its `is{Vertical}LayoutTheme`/theme-keys
 * helpers from a themeKey -> render-function map. Each case function keeps full control
 * of its own wrapping shell (verticals don't wrap every theme the same way), and the
 * `themes/private/registry.ts` one-off-tenant escape hatch is checked first, same as today.
 */
export function createLayoutRouter<TProps extends Record<string, unknown>, K extends string>(config: {
  vertical: PrivateVerticalKey
  themeKeys: readonly K[]
  cases: Record<K, (props: TProps & { themeKey?: string }) => ReactNode>
}) {
  function LayoutPage(props: TProps & { themeKey?: string }): ReactNode {
    if (isPrivateLayoutTheme(props.themeKey)) {
      return renderPrivateLayout(props as unknown as PrivateLayoutRenderArgs, config.vertical)
    }
    const render = props.themeKey ? config.cases[props.themeKey as K] : undefined
    return render ? render(props) : null
  }

  function isLayoutTheme(themeKey?: string): boolean {
    if (isPrivateLayoutTheme(themeKey)) return true
    return Boolean(themeKey && (config.themeKeys as readonly string[]).includes(themeKey))
  }

  return { LayoutPage, isLayoutTheme, themeKeys: config.themeKeys }
}
