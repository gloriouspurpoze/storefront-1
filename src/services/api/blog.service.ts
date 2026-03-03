/**
 * Blog API service – create and manage blog posts for content marketing.
 * Aligned with fixer-backend: /cms/admin/blogs and /cms/admin/blog-categories.
 *
 * Backend (fixer-backend) uses:
 * - settings: { allowComments, isFeatured } (not top-level)
 * - scheduledFor (not scheduledPublishAt)
 * - analytics.views, readingTime (not viewCount, readTime)
 */
import axios from 'axios';
import type {
  BlogPost,
  BlogPostCreatePayload,
  BlogListResponse,
  BlogCategory,
} from '../../types/cms.types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/** Raw post shape from backend (Blog model) */
interface BackendBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author?: { id?: string; _id?: string; name: string; avatar?: string };
  category?: { _id: string; name: string; slug?: string } | string;
  tags?: string[];
  status: string;
  publishedAt?: string;
  scheduledFor?: string;
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string };
  settings?: { allowComments?: boolean; isFeatured?: boolean; isSticky?: boolean };
  analytics?: { views?: number; likes?: number; shares?: number };
  readingTime?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function mapBackendPostToFrontend(raw: BackendBlogPost): BlogPost {
  const author = raw.author;
  const authorId = (author as any)?.id ?? (author as any)?._id ?? raw._id;
  return {
    _id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? '',
    content: raw.content ?? '',
    category:
      typeof raw.category === 'object' && raw.category !== null
        ? { _id: (raw.category as any)._id, name: (raw.category as any).name, slug: (raw.category as any).slug }
        : null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: (raw.status as BlogPost['status']) ?? 'draft',
    isFeatured: raw.settings?.isFeatured ?? false,
    allowComments: raw.settings?.allowComments ?? true,
    publishedAt: raw.publishedAt ?? null,
    scheduledPublishAt: raw.scheduledFor ?? null,
    viewCount: raw.analytics?.views ?? 0,
    readTime: raw.readingTime ?? 0,
    author: {
      _id: String(authorId),
      name: author?.name ?? 'Admin',
    },
    featuredImage: raw.featuredImage ?? null,
    seo: raw.seo,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };
}

/**
 * Normalize list response – backend returns { success, data: { posts, pagination } }.
 */
function normalizeListResponse(res: any): BlogListResponse {
  const data = res.data?.data ?? res.data;
  const rawPosts: BackendBlogPost[] = data?.posts ?? (Array.isArray(data) ? data : []);
  const posts = (Array.isArray(rawPosts) ? rawPosts : []).map(mapBackendPostToFrontend);
  const pagination = data?.pagination;
  return { posts, pagination };
}

/**
 * Normalize single post – backend returns { success, data: { post } }.
 */
function normalizePost(res: any): BlogPost {
  const data = res.data?.data ?? res.data;
  const post = data?.post ?? data;
  return mapBackendPostToFrontend(post as BackendBlogPost);
}

/**
 * Map admin payload to backend shape (settings.*, scheduledFor).
 */
function mapPayloadToBackend(payload: BlogPostCreatePayload): Record<string, unknown> {
  const {
    scheduledPublishAt,
    isFeatured,
    allowComments,
    ...rest
  } = payload;
  return {
    ...rest,
    settings: {
      allowComments: allowComments ?? true,
      isFeatured: isFeatured ?? false,
    },
    ...(scheduledPublishAt ? { scheduledFor: scheduledPublishAt } : {}),
  };
}

export const BlogService = {
  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
    isFeatured?: boolean;
  }): Promise<BlogListResponse> {
    const response = await axios.get(`${API_BASE}/cms/admin/blogs`, {
      ...getAuthHeaders(),
      params,
    });
    return normalizeListResponse(response);
  },

  async getPostById(id: string): Promise<BlogPost> {
    const response = await axios.get(`${API_BASE}/cms/admin/blogs/${id}`, getAuthHeaders());
    return normalizePost(response);
  },

  async createPost(payload: BlogPostCreatePayload): Promise<BlogPost> {
    const body = mapPayloadToBackend(payload);
    const response = await axios.post(
      `${API_BASE}/cms/admin/blogs`,
      body,
      getAuthHeaders()
    );
    return normalizePost(response);
  },

  async updatePost(id: string, payload: BlogPostCreatePayload): Promise<BlogPost> {
    const body = mapPayloadToBackend(payload);
    const response = await axios.put(
      `${API_BASE}/cms/admin/blogs/${id}`,
      body,
      getAuthHeaders()
    );
    return normalizePost(response);
  },

  async deletePost(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cms/admin/blogs/${id}`, getAuthHeaders());
  },

  /**
   * Fetch blog categories. Backend returns { success, data: { categories } }.
   */
  async getCategories(): Promise<BlogCategory[]> {
    const response = await axios.get(`${API_BASE}/cms/admin/blog-categories`, getAuthHeaders());
    const data = response.data?.data ?? response.data;
    const categories = data?.categories ?? data;
    return Array.isArray(categories) ? categories : [];
  },

  /**
   * Generate blog content with AI. Requires backend OPENAI_API_KEY.
   * Returns title, excerpt, content (HTML), suggestedTags.
   */
  async generateWithAI(payload: {
    topic: string;
    tone?: 'professional' | 'friendly' | 'casual' | 'informative';
    length?: 'short' | 'medium' | 'long';
    language?: string;
  }): Promise<{ title: string; excerpt: string; content: string; suggestedTags: string[] }> {
    const response = await axios.post(
      `${API_BASE}/cms/admin/blogs/ai-generate`,
      payload,
      getAuthHeaders()
    );
    const data = response.data?.data ?? response.data;
    return {
      title: data?.title ?? '',
      excerpt: data?.excerpt ?? '',
      content: data?.content ?? '',
      suggestedTags: Array.isArray(data?.suggestedTags) ? data.suggestedTags : [],
    };
  },
};
