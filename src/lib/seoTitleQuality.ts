/**
 * SEO document-title quality guardrails for the CMS authoring UI.
 *
 * Mirrors the consumer site's runtime behaviour so the admin warns about the
 * SAME failure the live site now defends against:
 *
 *   - `replaceServicePagePlaceholders` resolves `[City]` / `[Location]` /
 *     `[ServiceName]` tokens (consumer: `src/shared/types/categoryMarketing.ts`).
 *   - `isUsableCmsDocumentTitle` rejects titles that render broken in SERPs
 *     (consumer: `src/shared/lib/serverData.ts`).
 *
 * The bug this prevents: a CMS `seoTitle` like `"Electrician in [City]"` saved
 * on an industry-wide key (or with no locality) resolved to `"Electrician in"`,
 * which the live site rendered as
 *   `electrician near me Mumbai — Electrician in | ProFixer.in`.
 */

export type SeoPlaceholderContext = {
  /** Locality / city label, or '' for industry-wide (non-locality) keys. */
  city: string;
  /** Locality-in-sentence label, or '' for industry-wide keys. */
  location: string;
  /** Service / category label, e.g. "Electrician". */
  serviceName: string;
};

/**
 * Resolve `[City]` / `[Location]` / `[ServiceName]` / `[SERVICE]` tokens.
 * Case-insensitive, matching the consumer's `replaceServicePagePlaceholders`.
 */
export function resolveSeoPlaceholders(text: string, ctx: SeoPlaceholderContext): string {
  if (!text) return text;
  return text
    .replace(/\[City\]/gi, ctx.city)
    .replace(/\[Location\]/gi, ctx.location)
    .replace(/\[ServiceName\]/gi, ctx.serviceName)
    .replace(/\[SERVICE\]/gi, ctx.serviceName);
}

/** Strip a trailing ` | Brand` / ` – Brand` suffix so checks see the real tail. */
function stripBrandSuffix(title: string): string {
  return title.replace(/\s*[|–—-]\s*[^|–—-]+$/u, '').trim();
}

export type SeoTitleIssue = {
  /** Stable code for tests / analytics. */
  code: 'empty' | 'unresolved-token' | 'dangling-preposition';
  /** Human-readable explanation for the editor. */
  detail: string;
  /** The title as the live site would render it after token resolution. */
  resolved: string;
};

/**
 * Returns an issue when the CMS title would render broken on the live site,
 * or `null` when it is safe. Validates the RESOLVED title (after placeholder
 * substitution) so a healthy template like `"Electrician in [City]"` on a
 * locality key passes, while the same template on an industry-wide key (where
 * `[City]` resolves to '') is correctly flagged.
 */
export function detectSeoTitleIssue(
  rawTitle: string,
  ctx: SeoPlaceholderContext,
): SeoTitleIssue | null {
  const resolved = resolveSeoPlaceholders(rawTitle ?? '', ctx).replace(/\s{2,}/g, ' ').trim();

  if (!rawTitle || !rawTitle.trim()) {
    return {
      code: 'empty',
      detail: 'Empty — the live site falls back to a generic title. Add an offer + area title.',
      resolved,
    };
  }

  // Leftover [Token] means an unsupported placeholder the live site cannot fill.
  const leftover = resolved.match(/\[[^\]]+\]/);
  if (leftover) {
    return {
      code: 'unresolved-token',
      detail: `Contains unsupported placeholder ${leftover[0]}. Use [City], [Location] or [ServiceName] — or type the value directly.`,
      resolved,
    };
  }

  const core = stripBrandSuffix(resolved);
  if (!core) {
    return {
      code: 'empty',
      detail: 'Title is only a brand suffix after tokens resolve — add the service + area.',
      resolved,
    };
  }

  // Dangling preposition: ends with in/at/near/for and no locality after it.
  // This is the exact "Electrician in" breakage (e.g. [City] resolved to '').
  if (/\b(?:in|at|near|for|across)\s*[,–—-]?\s*$/i.test(core)) {
    const tokenHint = /\[City\]|\[Location\]/i.test(rawTitle)
      ? ' The locality token resolved to nothing — this key has no locality, so remove the token or set a locality.'
      : '';
    return {
      code: 'dangling-preposition',
      detail: `Resolves to "${core}" with no area after it — renders broken in search results.${tokenHint}`,
      resolved,
    };
  }

  return null;
}
