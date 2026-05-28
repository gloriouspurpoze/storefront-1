/**
 * CMS & Blog types for content marketing and blog management.
 * Keeps API contracts and UI state typing consistent.
 */

export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'archived';

/** FAQ entries: visible HTML + FAQPage JSON-LD (inject script on public site). */
export interface BlogFaqItem {
  question: string;
  answer: string;
}

/** Lead capture block rendered below article on the public site. */
export interface BlogLeadMagnetSettings {
  enabled: boolean;
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
  /** POST target for the form (consumer app). */
  formActionUrl?: string;
  /** Hidden field `source` value. */
  sourceTag?: string;
}

export interface BlogCategoryRef {
  _id: string;
  name: string;
  slug?: string;
}

export interface BlogAuthorRef {
  _id: string;
  name: string;
  email?: string;
}

export interface BlogPostSeo {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  /** Absolute canonical URL — consumer should emit `rel=canonical` when set */
  canonicalUrl?: string
  /** Open Graph / social title override */
  ogTitle?: string
  /** e.g. `article` (Open Graph) */
  ogType?: string
  /** `summary` | `summary_large_image` — Twitter/X card hint */
  twitterCard?: string
  /** Raw robots meta, e.g. `index, follow` or `noindex` for thin drafts */
  robots?: string
  /**
   * Explicit indexing flag. Mirrors the consumer-site `blogQualityGate`
   * (`src/shared/lib/seo/quality.ts`) — when `false` the post is excluded
   * from `/sitemaps/blog.xml` regardless of `status`. Kept alongside
   * `robots` so legacy noindex string overrides still work.
   */
  index?: boolean
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category?: BlogCategoryRef | null;
  tags: string[];
  status: BlogPostStatus;
  isFeatured: boolean;
  allowComments?: boolean;
  /**
   * Explicit indexing flag. Top-level mirror of `seo.index` for backends that
   * persist the flag at the post root. Consumer's `blogQualityGate` checks
   * `post.index !== false` AND `post.seo?.index !== false`.
   */
  index?: boolean;
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
  viewCount: number;
  readTime: number;
  author: BlogAuthorRef;
  featuredImage?: string | null;
  /** Accessibility + SEO; stored when the API accepts it. */
  featuredImageAlt?: string | null;
  seo?: BlogPostSeo;
  faqItems?: BlogFaqItem[];
  leadMagnet?: BlogLeadMagnetSettings;
  /** Optional: product cross-links for internal linking + conversion */
  relatedProducts?: Array<{ _id: string; name: string; slug?: string }>;
  /** Optional: platform-service cross-links (bookable catalog) */
  relatedServices?: Array<{ _id: string; name: string; slug?: string }>;
  createdAt: string;
  updatedAt?: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  postCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface BlogPostCreatePayload {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category?: string;
  tags: string[];
  status: BlogPostStatus;
  isFeatured: boolean;
  allowComments?: boolean;
  /** Top-level mirror of `seo.index`. See `BlogPost.index` doc-comment. */
  index?: boolean;
  featuredImage?: string;
  featuredImageAlt?: string;
  scheduledPublishAt?: string | null;
  seo?: BlogPostSeo;
  faqItems?: BlogFaqItem[];
  leadMagnet?: BlogLeadMagnetSettings;
  /** Product IDs to store in `relatedProducts` */
  relatedProductIds?: string[];
  /** PlatformService IDs to store in `relatedServices` */
  relatedServiceIds?: string[];
}

export interface BlogListResponse {
  posts: BlogPost[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}
