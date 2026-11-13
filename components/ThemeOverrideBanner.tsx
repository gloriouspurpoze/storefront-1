import { THEME_OVERRIDE_PARAM, themesForVertical } from '@/lib/themeOverride'

/**
 * Dev/QA notice shown while a `?theme=` override is active (see lib/themeOverride.ts).
 * Server component, plain markup and inline styles — same approach as PreviewBanner so
 * theme CSS and tenant customCss can't hide it.
 */
export function ThemeOverrideBanner({
  themeKey,
  verticalKey,
}: {
  themeKey: string
  verticalKey: string | null | undefined
}) {
  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    whiteSpace: 'nowrap' as const,
  }
  return (
    <div
      role="region"
      aria-label="Theme override"
      data-storefront-theme-override=""
      style={{
        position: 'relative',
        zIndex: 2147483000,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px 12px',
        padding: '6px 16px',
        background: '#4c1d95',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      <span>
        <strong style={{ fontWeight: 600 }}>Theme override: {themeKey}</strong> — testing only, not saved
      </span>
      {themesForVertical(verticalKey)
        .filter((k) => k !== themeKey)
        .map((k) => (
          <a key={k} href={`?${THEME_OVERRIDE_PARAM}=${k}`} style={linkStyle}>
            {k}
          </a>
        ))}
      <a
        href={`?${THEME_OVERRIDE_PARAM}=off`}
        style={{
          color: '#4c1d95',
          background: '#fbbf24',
          borderRadius: '9999px',
          padding: '2px 10px',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Clear override
      </a>
    </div>
  )
}
