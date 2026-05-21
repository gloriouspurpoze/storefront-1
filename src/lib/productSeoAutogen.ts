/**
 * Product SEO auto-generation
 * ----------------------------------------------------------------------------
 * Pure, deterministic helpers that synthesize SEO Title / Description / Keywords
 * from the product form state. Designed to behave exactly the same on the server
 * and in the browser — no DOMParser, no `window`, no fetches.
 *
 * Rules-of-thumb baked in (Google / Bing SERP best practice):
 *   - Title  ≤ 60 chars, brand-first when available, action verb at the end
 *   - Desc   120–158 chars (Google's mobile snippet sweet-spot), price + benefit
 *   - Kwds   8–14 long-tail tokens, deduped, no fluff
 *
 * The functions are pure and tree-shake-friendly so the `<Plan editor>` and
 * `<Add product>` form can share them without dragging UI code along.
 */

export interface ProductSeoInput {
  name?: string;
  brand?: string;
  model?: string;
  categoryLabel?: string;
  shortDescription?: string;
  description?: string;
  /** Sale price in rupees. */
  price?: number | string;
  /** Original / MRP price in rupees — used to compute a discount %. */
  originalPrice?: number | string;
  tags?: string[];
  specifications?: Array<{ key?: string; value?: string }>;
  isOnSale?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  /** Free-shipping hint surfaced in description / keywords when truthy. */
  freeShipping?: boolean;
  /** Warranty period (months) — adds a trust signal in the description. */
  warrantyPeriod?: number;
}

export interface ProductSeoSuggestion {
  title: string;
  description: string;
  keywords: string[];
}

/** Strip HTML, collapse whitespace, trim. */
export function plainTextFromHtml(html: string | undefined | null): string {
  if (!html) return '';
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  // Cut at the last word boundary so we don't slice a word in half.
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/g, '') + '…';
}

function toRupeeNum(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function discountPercent(input: ProductSeoInput): number {
  const p = toRupeeNum(input.price);
  const mrp = toRupeeNum(input.originalPrice);
  if (!p || !mrp || mrp <= p) return 0;
  return Math.round(((mrp - p) / mrp) * 100);
}

function formatINR(rupees: number): string {
  if (!rupees) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/* -------------------------------------------------------------------------- */
/* Title                                                                       */
/* -------------------------------------------------------------------------- */

export function buildSeoTitle(input: ProductSeoInput): string {
  const name = String(input.name ?? '').trim();
  if (!name) return '';
  const brand = String(input.brand ?? '').trim();
  const model = String(input.model ?? '').trim();
  const pct = discountPercent(input);

  // Industry order: <Brand> <Product Name> [Model] — buy/get qualifier.
  const head = brand && !name.toLowerCase().includes(brand.toLowerCase())
    ? `${brand} ${name}`
    : name;
  const subject =
    model && !head.toLowerCase().includes(model.toLowerCase())
      ? `${head} ${model}`
      : head;

  let tail: string;
  if (pct >= 10) tail = `Buy Online @ ${pct}% OFF`;
  else if (input.isOnSale) tail = 'Sale Price Online';
  else if (input.isNew) tail = 'Buy New Online';
  else tail = 'Buy Online';

  const built = `${subject} — ${tail}`;
  return clamp(built, 60);
}

/* -------------------------------------------------------------------------- */
/* Description                                                                 */
/* -------------------------------------------------------------------------- */

export function buildSeoDescription(input: ProductSeoInput): string {
  const name = String(input.name ?? '').trim();
  if (!name) return '';
  const brand = String(input.brand ?? '').trim();
  const cat = String(input.categoryLabel ?? '').trim();
  const shortDesc = plainTextFromHtml(input.shortDescription ?? '');
  const longDesc = plainTextFromHtml(input.description ?? '');
  const pieces: string[] = [];

  // Lead with the product + brand + category hook.
  const subject = brand
    ? `${brand} ${name}`
    : cat
      ? `${name} (${cat})`
      : name;
  pieces.push(`Shop ${subject} online at ProFixer.`);

  // Best one-liner about the product.
  const blurb = shortDesc || longDesc;
  if (blurb) {
    pieces.push(clamp(blurb.replace(/\s+/g, ' ').trim(), 90));
  }

  // Trust + commerce signals
  const trust: string[] = [];
  const pct = discountPercent(input);
  if (pct >= 5) {
    const sale = toRupeeNum(input.price);
    trust.push(sale ? `Now at ${formatINR(sale)} — flat ${pct}% OFF.` : `Flat ${pct}% off.`);
  } else if (toRupeeNum(input.price)) {
    trust.push(`Starting from ${formatINR(toRupeeNum(input.price))}.`);
  }
  if (input.freeShipping) trust.push('Free shipping.');
  if (input.warrantyPeriod && input.warrantyPeriod > 0) {
    trust.push(`${input.warrantyPeriod}-month warranty.`);
  }
  if (trust.length === 0) trust.push('Fast delivery & secure checkout.');
  pieces.push(trust.join(' '));

  const built = pieces.join(' ').replace(/\s+/g, ' ').trim();
  return clamp(built, 158);
}

/* -------------------------------------------------------------------------- */
/* Keywords                                                                    */
/* -------------------------------------------------------------------------- */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'are', 'into',
  'will', 'has', 'have', 'you', 'our', 'all', 'any', 'use', 'used', 'one',
  'made', 'when', 'how', 'why', 'who', 'what', 'where', 'now', 'new', 'best',
  'top', 'great', 'amazing', 'awesome', 'super', 'good', 'high', 'low', 'over',
  'about', 'more', 'less', 'than', 'very', 'just', 'also', 'each', 'every',
  'their', 'theirs', 'a', 'an', 'in', 'on', 'of', 'to', 'by', 'is', 'it', 'or',
  'as', 'be', 'at',
]);

function normalizeKeyword(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 +&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSeoKeywords(input: ProductSeoInput): string[] {
  const out: string[] = [];

  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const k = normalizeKeyword(raw);
    if (!k || k.length < 2) return;
    if (STOPWORDS.has(k)) return;
    if (!out.includes(k)) out.push(k);
  };

  const name = String(input.name ?? '').trim();
  if (name) {
    add(name);
    // Add a price-qualified variant if there's a strong discount.
    const pct = discountPercent(input);
    if (pct >= 10) add(`${name} ${pct}% off`);
    if (input.isOnSale) add(`${name} sale`);
    add(`buy ${name}`);
    add(`${name} online`);
  }

  if (input.brand) add(`${input.brand} ${name || ''}`);
  if (input.brand) add(input.brand);
  if (input.categoryLabel) add(input.categoryLabel);
  if (input.model) add(`${name || ''} ${input.model}`);

  (input.tags ?? []).forEach((t) => add(t));

  (input.specifications ?? [])
    .slice(0, 6)
    .forEach((s) => {
      if (s.key && s.value) add(`${s.value} ${s.key}`);
    });

  if (input.categoryLabel) add(`best ${input.categoryLabel} online`);
  if (input.freeShipping) add('free shipping');
  if (input.warrantyPeriod && input.warrantyPeriod > 0) add('with warranty');

  return out.slice(0, 14);
}

/* -------------------------------------------------------------------------- */
/* Combined                                                                    */
/* -------------------------------------------------------------------------- */

export function buildProductSeoSuggestion(input: ProductSeoInput): ProductSeoSuggestion {
  return {
    title: buildSeoTitle(input),
    description: buildSeoDescription(input),
    keywords: buildSeoKeywords(input),
  };
}

/**
 * Auto-fill any empty SEO fields from current product data — used right before
 * save so we never persist a product with blank SEO.
 *
 * Returns a partial that the caller merges into form state.
 */
export function fillMissingProductSeo(
  current: { seoTitle?: string; seoDescription?: string; seoKeywords?: string[] },
  source: ProductSeoInput,
): { seoTitle: string; seoDescription: string; seoKeywords: string[] } {
  const suggestion = buildProductSeoSuggestion(source);
  return {
    seoTitle: (current.seoTitle ?? '').trim() || suggestion.title,
    seoDescription: (current.seoDescription ?? '').trim() || suggestion.description,
    seoKeywords:
      Array.isArray(current.seoKeywords) && current.seoKeywords.length > 0
        ? current.seoKeywords
        : suggestion.keywords,
  };
}
