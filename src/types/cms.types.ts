/**
 * CMS & Blog types for content marketing and blog management.
 * Keeps API contracts and UI state typing consistent.
 */

export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'archived';

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
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
  viewCount: number;
  readTime: number;
  author: BlogAuthorRef;
  featuredImage?: string | null;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
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
  featuredImage?: string;
  scheduledPublishAt?: string | null;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
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
