/**
 * Draft-preview notice (server component, plain markup — no client JS).
 *
 * Rendered in normal document flow at the very top of the tenant layout rather
 * than `position: fixed`: it pushes the theme header down instead of covering
 * it, and never fights theme headers that are themselves `sticky top-0`
 * (home-services / trade-pro). Inline styles keep it immune to theme CSS and
 * tenant `customCss`.
 */
/** `expired`: cookie present but the draft could not be loaded — the live site is showing. */
export function PreviewBanner({ expired = false }: { expired?: boolean }) {
  return (
    <div
      role="region"
      aria-label="Draft preview"
      data-storefront-preview-banner=""
      style={{
        position: 'relative',
        zIndex: 2147483000,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px 12px',
        padding: '6px 16px',
        background: '#111827',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      <span>
        {expired ? (
          <>
            <strong style={{ fontWeight: 600 }}>Preview link expired</strong> — showing the live site
          </>
        ) : (
          <>
            <strong style={{ fontWeight: 600 }}>Previewing a draft</strong> — not live
          </>
        )}
      </span>
      <a
        href="/api/preview?exit=1"
        style={{
          color: '#111827',
          background: '#fbbf24',
          borderRadius: '9999px',
          padding: '2px 10px',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Exit preview
      </a>
    </div>
  )
}
