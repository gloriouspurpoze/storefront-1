import { describe, expect, it } from 'vitest'
import { parseCustomSnippet } from '../customScripts'
import { googleFontsHref, resolveSiteFonts, sanitizeFontFamily } from '../siteFonts'

describe('parseCustomSnippet', () => {
  it('returns nothing for empty input and wraps bare JS', () => {
    expect(parseCustomSnippet('')).toEqual([])
    expect(parseCustomSnippet('  console.log(1)  ')).toEqual([{ kind: 'script', attrs: {}, code: 'console.log(1)' }])
  })

  it('extracts inline + src scripts, noscript, meta and link', () => {
    const nodes = parseCustomSnippet(`
      <!-- Hotjar -->
      <script async src="https://cdn.example.com/x.js" onload="alert(1)" data-site="7"></script>
      <script>window.x = 1</script>
      <noscript><img src="https://px.example.com/p.gif" /></noscript>
      <meta name="facebook-domain-verification" content="abc" />
      <link rel="preconnect" href="https://cdn.example.com">
    `)
    expect(nodes).toEqual([
      { kind: 'script', attrs: { async: true, src: 'https://cdn.example.com/x.js', 'data-site': '7' }, code: '' },
      { kind: 'script', attrs: {}, code: 'window.x = 1' },
      { kind: 'noscript', html: '<img src="https://px.example.com/p.gif" />' },
      { kind: 'meta', attrs: { name: 'facebook-domain-verification', content: 'abc' } },
      { kind: 'link', attrs: { rel: 'preconnect', href: 'https://cdn.example.com' } },
    ])
  })

  it('drops empty scripts and event-handler attributes', () => {
    expect(parseCustomSnippet('<script onerror="x()"></script>')).toEqual([])
  })
})

describe('siteFonts', () => {
  it('sanitizes family names', () => {
    expect(sanitizeFontFamily(' Playfair  Display ')).toBe('Playfair Display')
    expect(sanitizeFontFamily("Inter'; } body { x")).toBeNull()
    expect(sanitizeFontFamily('')).toBeNull()
  })

  it('builds a Google Fonts URL and dedupes', () => {
    expect(googleFontsHref(['Inter', 'Inter'])).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    )
    expect(googleFontsHref([])).toBeNull()
  })

  it('returns null when no override is set', () => {
    expect(resolveSiteFonts({}, '.x')).toBeNull()
    const r = resolveSiteFonts({ fontHeading: 'Playfair Display' }, '.x')
    expect(r?.href).toContain('family=Playfair+Display')
    expect(r?.css).toContain("'Playfair Display'")
    expect(r?.css).not.toContain('ui-sans-serif')
  })
})
