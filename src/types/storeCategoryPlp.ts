/**
 * Store category PLP CMS — `GET/PUT /cms/.../static-content/store-category-plp`
 * Keyed by product category slug (e.g. `electrical`, `plumbing`).
 */

export interface StorePlpSubcategoryBlock {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder?: number;
}

export interface StorePlpIntroSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface StorePlpFaqBlock {
  question: string;
  answer: string;
}

export interface StorePlpRelatedLink {
  label: string;
  href: string;
}

export interface StorePlpPriceBand {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export interface StorePlpFilterConfig {
  enableBrand: boolean;
  enablePrice: boolean;
  enableProductType: boolean;
  enableAmpere: boolean;
  enableWireSize: boolean;
  brands: string[];
  priceBands: StorePlpPriceBand[];
  productTypes: string[];
}

export interface StorePlpBulkCta {
  headline: string;
  description: string;
  whatsappMessage: string;
}

export interface StorePlpBuyingGuide {
  title: string;
  paragraphs: string[];
}

export interface StorePlpTechnicalSeo {
  robotsMeta: string;
  canonicalOverride: string;
}

export interface StoreCategoryPlpConfig {
  enabled: boolean;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  shortDescription: string;
  introSections: StorePlpIntroSection[];
  subcategories: StorePlpSubcategoryBlock[];
  faqs: StorePlpFaqBlock[];
  buyingGuide: StorePlpBuyingGuide;
  bulkCta: StorePlpBulkCta;
  relatedLinks: StorePlpRelatedLink[];
  filterConfig: StorePlpFilterConfig;
  technicalSeo: StorePlpTechnicalSeo;
}

export type StoreCategoryPlpRecord = Record<string, StoreCategoryPlpConfig>;

export function emptyStoreCategoryPlpConfig(): StoreCategoryPlpConfig {
  return {
    enabled: true,
    seoTitle: '',
    metaDescription: '',
    h1: '',
    shortDescription: '',
    introSections: [],
    subcategories: [],
    faqs: [],
    buyingGuide: { title: '', paragraphs: [] },
    bulkCta: {
      headline: 'Bulk project? Get special pricing for contractors & builders',
      description: 'Share your bill of materials on WhatsApp for trade pricing.',
      whatsappMessage: 'Hi ProFixer, I need bulk pricing for store supplies.',
    },
    relatedLinks: [],
    filterConfig: {
      enableBrand: true,
      enablePrice: true,
      enableProductType: true,
      enableAmpere: false,
      enableWireSize: false,
      brands: [],
      priceBands: [
        { id: '0-200', label: '₹0 – ₹200', min: 0, max: 200 },
        { id: '200-500', label: '₹200 – ₹500', min: 200, max: 500 },
        { id: '500-1500', label: '₹500 – ₹1,500', min: 500, max: 1500 },
        { id: '1500+', label: '₹1,500+', min: 1500 },
      ],
      productTypes: [],
    },
    technicalSeo: { robotsMeta: 'index, follow', canonicalOverride: '' },
  };
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function normalizeStoreCategoryPlpConfig(raw: unknown): StoreCategoryPlpConfig {
  const e = emptyStoreCategoryPlpConfig();
  if (!raw || typeof raw !== 'object') return e;
  const p = raw as Record<string, unknown>;

  const introSections = Array.isArray(p.introSections)
    ? (p.introSections as unknown[]).map((row, i) => {
        const r = row as Record<string, unknown>;
        return {
          id: asString(r.id, `section-${i}`),
          title: asString(r.title),
          paragraphs: asStringArray(r.paragraphs),
        };
      })
    : [];

  const subcategories = Array.isArray(p.subcategories)
    ? (p.subcategories as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          slug: asString(r.slug),
          title: asString(r.title),
          description: asString(r.description),
          imageUrl: asString(r.imageUrl),
          sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0,
        };
      }).filter((s) => s.slug && s.title)
    : [];

  const faqs = Array.isArray(p.faqs)
    ? (p.faqs as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        return { question: asString(r.question), answer: asString(r.answer) };
      }).filter((f) => f.question && f.answer)
    : [];

  const fcRaw = (p.filterConfig as Record<string, unknown>) || {};
  const priceBands = Array.isArray(fcRaw.priceBands)
    ? (fcRaw.priceBands as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: asString(r.id),
          label: asString(r.label),
          min: typeof r.min === 'number' ? r.min : undefined,
          max: typeof r.max === 'number' ? r.max : undefined,
        };
      }).filter((b) => b.id)
    : e.filterConfig.priceBands;

  const bgRaw = (p.buyingGuide as Record<string, unknown>) || {};
  const bulkRaw = (p.bulkCta as Record<string, unknown>) || {};
  const tsRaw = (p.technicalSeo as Record<string, unknown>) || {};

  return {
    enabled: asBool(p.enabled, true),
    seoTitle: asString(p.seoTitle),
    metaDescription: asString(p.metaDescription),
    h1: asString(p.h1),
    shortDescription: asString(p.shortDescription),
    introSections,
    subcategories,
    faqs,
    buyingGuide: {
      title: asString(bgRaw.title),
      paragraphs: asStringArray(bgRaw.paragraphs),
    },
    bulkCta: {
      headline: asString(bulkRaw.headline, e.bulkCta.headline),
      description: asString(bulkRaw.description, e.bulkCta.description),
      whatsappMessage: asString(bulkRaw.whatsappMessage, e.bulkCta.whatsappMessage),
    },
    relatedLinks: Array.isArray(p.relatedLinks)
      ? (p.relatedLinks as unknown[])
          .map((row) => {
            const r = row as Record<string, unknown>;
            return { label: asString(r.label), href: asString(r.href) };
          })
          .filter((l) => l.label && l.href)
      : [],
    filterConfig: {
      enableBrand: asBool(fcRaw.enableBrand, true),
      enablePrice: asBool(fcRaw.enablePrice, true),
      enableProductType: asBool(fcRaw.enableProductType, true),
      enableAmpere: asBool(fcRaw.enableAmpere, false),
      enableWireSize: asBool(fcRaw.enableWireSize, false),
      brands: asStringArray(fcRaw.brands),
      priceBands,
      productTypes: asStringArray(fcRaw.productTypes),
    },
    technicalSeo: {
      robotsMeta: asString(tsRaw.robotsMeta, e.technicalSeo.robotsMeta),
      canonicalOverride: asString(tsRaw.canonicalOverride),
    },
  };
}

export function normalizeStoreCategoryPlpRecord(raw: unknown): StoreCategoryPlpRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: StoreCategoryPlpRecord = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (key.trim()) out[key.trim()] = normalizeStoreCategoryPlpConfig(val);
  }
  return out;
}
