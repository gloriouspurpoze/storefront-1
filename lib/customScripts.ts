/**
 * Parse a super-admin pasted snippet (`customHeadScripts` / `customBodyScripts`) into
 * elements React can render. Raw HTML in `dangerouslySetInnerHTML` never executes
 * `<script>`, so each tag is pulled out and re-emitted as a real element.
 *
 * Supported: `<script>` (inline or `src`), `<noscript>`, `<meta>`, `<link>`.
 * A snippet with no tags at all is treated as one inline script.
 */
export type CustomSnippetNode =
  | { kind: 'script'; attrs: Record<string, string | true>; code: string }
  | { kind: 'noscript'; html: string }
  | { kind: 'meta' | 'link'; attrs: Record<string, string | true> }

const SCRIPT_ATTRS = new Set(['src', 'async', 'defer', 'type', 'id', 'crossorigin', 'integrity', 'referrerpolicy', 'nomodule'])
const META_ATTRS = new Set(['name', 'content', 'property', 'http-equiv', 'charset'])
const LINK_ATTRS = new Set(['rel', 'href', 'as', 'type', 'crossorigin', 'media', 'sizes', 'hreflang'])

function parseAttrs(raw: string, allowed: Set<string>): Record<string, string | true> {
  const out: Record<string, string | true> = {}
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase()
    if (!allowed.has(name) && !name.startsWith('data-')) continue
    const value = m[2] ?? m[3] ?? m[4]
    out[name] = value === undefined ? true : value
  }
  return out
}

export function parseCustomSnippet(snippet: string | undefined | null): CustomSnippetNode[] {
  const src = (snippet ?? '').trim()
  if (!src) return []
  if (!/<[a-z!]/i.test(src)) return [{ kind: 'script', attrs: {}, code: src }]

  const nodes: CustomSnippetNode[] = []
  const re =
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>|<(meta|link)\b([^>]*?)\/?>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m[0].toLowerCase().startsWith('<script')) {
      const attrs = parseAttrs(m[1], SCRIPT_ATTRS)
      const code = m[2].trim()
      if (attrs.src || code) nodes.push({ kind: 'script', attrs, code })
    } else if (m[3] !== undefined) {
      if (m[3].trim()) nodes.push({ kind: 'noscript', html: m[3].trim() })
    } else {
      const kind = m[4].toLowerCase() as 'meta' | 'link'
      const attrs = parseAttrs(m[5], kind === 'meta' ? META_ATTRS : LINK_ATTRS)
      if (Object.keys(attrs).length) nodes.push({ kind, attrs })
    }
  }
  return nodes
}

const REACT_PROP_NAMES: Record<string, string> = {
  crossorigin: 'crossOrigin',
  referrerpolicy: 'referrerPolicy',
  nomodule: 'noModule',
  'http-equiv': 'httpEquiv',
  charset: 'charSet',
  hreflang: 'hrefLang',
}

/** HTML attribute names → React prop names (data-* pass through unchanged). */
export function toReactProps(attrs: Record<string, string | true>): Record<string, string | true> {
  const out: Record<string, string | true> = {}
  for (const [k, v] of Object.entries(attrs)) out[REACT_PROP_NAMES[k] ?? k] = v
  return out
}
