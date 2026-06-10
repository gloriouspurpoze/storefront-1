import axios from 'axios';
import { TENANT_HEADER } from '../../lib/saasEnv';
import type { CategoryMarketingConfig } from '../../types/categoryMarketing';
import type { StoreCategoryPlpConfig } from '../../types/storeCategoryPlp';
import type { PricingCategoryMetaConfig } from '../../types/pricingCategoryMeta';

/**
 * Locality master record — hyperlocal CMS inputs + SEO quality signals.
 * Mirrored on the user-site so the same registry can drive
 * `localityRegistry.ts` gating at sitemap-generation time.
 */
export type ServiceCatalogLocalityWriteBody = {
  name: string
  slug?: string
  sortOrder?: number
  isActive?: boolean
  parentCity?: string
  neighborhoods?: string[]
  societies?: string[]
  infrastructureFacts?: string[]
  isIndexable?: boolean
  qualitySignals?: {
    providerAvailability?: boolean
    reviewCount?: boolean | number
    hasUniqueContent?: boolean
    faqCoverage?: boolean
    hasPricingInfo?: boolean
    searchDemand?: boolean
    contentQualityScore?: number
  }
}

// API_BASE should include /api (e.g., http://localhost:8005/api)
// Endpoints should NOT include /api prefix (e.g., /cms/admin/testimonials)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * CMS API Service
 * Centralized service for all CMS-related API calls
 */
export class CMSService {
  private static getAuthHeaders() {
    // Lazy-read Redux so importing CMSService via the services/api barrel does not
    // participate in a store ↔ authSlice ↔ api circular init at module load time.
    let token: string | null = null
    let tenantId: string | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { store } = require('../../store') as typeof import('../../store')
      const state = store.getState()
      token = state.auth?.token ?? null
      tenantId = state.tenant?.tenantId ?? null
    } catch {
      /* store not ready yet */
    }
    if (!token) token = localStorage.getItem('token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId ? { [TENANT_HEADER]: tenantId } : {}),
      },
    };
  }

  // ==================== HOMEPAGE ====================

  static async getHomepageSections(params?: { status?: string; type?: string }) {
    const response = await axios.get(`${API_BASE}/cms/admin/homepage`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createHomepageSection(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/homepage`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateHomepageSection(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/homepage/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteHomepageSection(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/homepage/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== BANNERS ====================

  static async getBanners(params?: { status?: string; location?: string }) {
    const response = await axios.get(`${API_BASE}/cms/admin/banners`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createBanner(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/banners`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateBanner(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/banners/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteBanner(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/banners/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  static async trackBanner(id: string, eventType: 'view' | 'click') {
    const response = await axios.post(
      `${API_BASE}/cms/admin/banners/${id}/track`,
      { eventType },
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== PROMOTIONS ====================

  static async getPromotions(params?: { status?: string; type?: string }) {
    const response = await axios.get(`${API_BASE}/cms/admin/promotions`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createPromotion(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/promotions`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updatePromotion(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/promotions/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deletePromotion(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/promotions/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== TESTIMONIALS ====================

  static async getTestimonials(params?: {
    page?: number;
    limit?: number;
    isApproved?: boolean;
    isFeatured?: boolean;
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/testimonials`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createTestimonial(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/testimonials`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateTestimonial(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/testimonials/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteTestimonial(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/testimonials/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== FAQS ====================

  static async getFAQs(params?: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/faqs`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async getFAQCategories() {
    const response = await axios.get(
      `${API_BASE}/cms/admin/faqs/categories`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async createFAQ(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/faqs`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateFAQ(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/faqs/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteFAQ(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/faqs/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== SEO ====================

  static async getSEOMetas(params?: { page?: string; isActive?: boolean }) {
    const response = await axios.get(`${API_BASE}/cms/admin/seo`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createSEOMeta(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/seo`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateSEOMeta(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/seo/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteSEOMeta(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/seo/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== BLOG POSTS ====================

  static async getBlogPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
    isFeatured?: boolean;
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/blog/posts`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async getBlogPostById(id: string) {
    const response = await axios.get(
      `${API_BASE}/cms/admin/blog/posts/${id}`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async createBlogPost(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/blog/posts`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateBlogPost(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/blog/posts/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteBlogPost(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/blog/posts/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== BLOG CATEGORIES ====================

  static async getBlogCategories(params?: { isActive?: boolean }) {
    const response = await axios.get(`${API_BASE}/cms/admin/blog/categories`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async createBlogCategory(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/blog/categories`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateBlogCategory(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/blog/categories/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteBlogCategory(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/blog/categories/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== MEDIA ====================

  static async getMedia(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    folder?: string;
    tags?: string;
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/media`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data as {
      files: unknown[]
      pagination: { total: number; page: number; limit: number; pages: number }
    }
  }

  static async getMediaStats() {
    const response = await axios.get(`${API_BASE}/cms/admin/media/stats`, this.getAuthHeaders())
    return response.data.data.stats as Array<{ _id: string; count: number; totalSize: number }>
  }

  static async getMediaFolders() {
    const response = await axios.get(`${API_BASE}/cms/admin/media/folders`, this.getAuthHeaders())
    return (response.data.data.folders || []) as string[]
  }

  static async createMediaRecord(payload: Record<string, unknown>) {
    const response = await axios.post(`${API_BASE}/cms/admin/media`, payload, this.getAuthHeaders())
    return response.data.data.file
  }

  static async uploadMedia(formData: FormData) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/cms/admin/media/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  static async updateMedia(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/media/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteMedia(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/media/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== PAGES ====================

  static async getPages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    template?: string;
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/pages`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async getPageById(id: string) {
    const response = await axios.get(
      `${API_BASE}/cms/admin/pages/${id}`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async createPage(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/pages`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updatePage(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/pages/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deletePage(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/pages/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== MENUS ====================

  static async getMenus(params?: { location?: string; isActive?: boolean }) {
    const response = await axios.get(`${API_BASE}/cms/admin/menus`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  static async getMenuById(id: string) {
    const response = await axios.get(
      `${API_BASE}/cms/admin/menus/${id}`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async createMenu(data: any) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/menus`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async updateMenu(id: string, data: any) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/menus/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async deleteMenu(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/menus/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ==================== ANALYTICS ====================

  static async getCMSAnalytics() {
    const response = await axios.get(
      `${API_BASE}/cms/admin/analytics`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  // ==================== RATE CARD (catalog pricing parts by category) ====================

  static async getRateCards(): Promise<Record<string, Array<{ name: string; price: string }>>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/rate-card`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateRateCards(data: Record<string, Array<{ name: string; price: string }>>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/rate-card`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  /** Partner / technician playbook — admin-only blob (no public GET). Same shape as customer rate-card JSON. */
  static async getProviderRateCards(): Promise<Record<string, Array<{ name: string; price: string }>>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/provider-rate-card`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateProviderRateCards(data: Record<string, Array<{ name: string; price: string }>>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/provider-rate-card`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  // ==================== CATEGORY MARKETING (industry service page template + catalog blocks) ====================
  /**
   * Backend should persist this payload as schemaless JSON per category key (`localSeo`, `technicalSeo`, `localityGuide`, etc.).
   * If the API validates keys strictly, extend the server schema to allow the full `CategoryMarketingConfig` shape.
   */
  static async getCategoryMarketing(): Promise<Record<string, CategoryMarketingConfig>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/category-marketing`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateCategoryMarketing(data: Record<string, CategoryMarketingConfig>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/category-marketing`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  // ==================== PRICING CATEGORY META (`/pricing/:category`) ====================
  /**
   * Editorial narrative + 3-column rate rows surrounding a `/pricing/{slug}`
   * page on the user site. Keyed by catalog industry slug (same key as
   * category-marketing / rate-card). Schemaless JSON on the backend so the
   * full `PricingCategoryMetaConfig` shape can evolve without migrations.
   */
  static async getPricingCategoryMeta(): Promise<Record<string, PricingCategoryMetaConfig>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/pricing-category-meta`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updatePricingCategoryMeta(data: Record<string, PricingCategoryMetaConfig>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/pricing-category-meta`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  // ==================== STORE CATEGORY PLP (`/store/:slug`) ====================

  static async getStoreCategoryPlp(): Promise<Record<string, StoreCategoryPlpConfig>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/store-category-plp`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateStoreCategoryPlp(data: Record<string, StoreCategoryPlpConfig>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/store-category-plp`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  // ==================== SERVICE CATALOG LOCALITIES (hyperlocal `/services/.../{slug}`) ====================

  /**
   * Locality master directory. Now carries hyperlocal CMS inputs
   * (neighborhoods, societies, infrastructureFacts) and SEO quality signals
   * that the user-site's `localityRegistry.ts` would otherwise own in code.
   * Backend should treat the new fields as optional/schemaless so this client
   * stays forward-compatible until the API contract catches up.
   */
  static async listServiceCatalogLocalities(): Promise<
    Array<{
      _id: string
      slug: string
      name: string
      sortOrder: number
      isActive: boolean
      parentCity?: string
      neighborhoods?: string[]
      societies?: string[]
      infrastructureFacts?: string[]
      isIndexable?: boolean
      qualitySignals?: {
        providerAvailability?: boolean
        reviewCount?: boolean | number
        hasUniqueContent?: boolean
        faqCoverage?: boolean
        hasPricingInfo?: boolean
        searchDemand?: boolean
        contentQualityScore?: number
      }
      createdAt?: string
      updatedAt?: string
    }>
  > {
    const response = await axios.get(`${API_BASE}/cms/admin/service-catalog-localities`, this.getAuthHeaders())
    return response.data?.data ?? []
  }

  static async createServiceCatalogLocality(body: ServiceCatalogLocalityWriteBody) {
    const response = await axios.post(
      `${API_BASE}/cms/admin/service-catalog-localities`,
      body,
      this.getAuthHeaders(),
    )
    return response.data?.data
  }

  static async updateServiceCatalogLocality(
    id: string,
    body: Partial<ServiceCatalogLocalityWriteBody>,
  ) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/service-catalog-localities/${encodeURIComponent(id)}`,
      body,
      this.getAuthHeaders(),
    )
    return response.data?.data
  }

  static async deleteServiceCatalogLocality(id: string) {
    const response = await axios.delete(
      `${API_BASE}/cms/admin/service-catalog-localities/${encodeURIComponent(id)}`,
      this.getAuthHeaders(),
    )
    return response.data?.data
  }

  // ==================== CROSS-LINKING (common problems by category for SEO) ====================

  static async getCrossLinking(): Promise<Record<string, string[]>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/cross-linking`,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateCrossLinking(data: Record<string, string[]>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/cross-linking`,
      data,
      this.getAuthHeaders()
    );
    return response.data?.data ?? response.data;
  }

  // ==================== PROGRAMMATIC SEO LANDING PAGES ====================
  /**
   * Schemaless static-content blobs for Template B/C pages on the user site:
   *   /charges/[slug]  /problems/[slug]  /guide/[slug]  /provider/[slug]
   * Each record is keyed by slug → entity JSON (see user-site `seo/entities/types.ts`).
   */

  static async getSeoProblems(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-problems`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoProblems(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-problems`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  static async getSeoCostGuides(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-cost-guides`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoCostGuides(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-cost-guides`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  static async getSeoGuides(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-guides`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoGuides(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-guides`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  static async getSeoProviders(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-providers`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoProviders(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-providers`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  static async getSeoLocations(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-locations`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoLocations(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-locations`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  /** Flat local "money page" landing entities → consumer `/{flat-slug}`. */
  static async getSeoLandingPages(): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${API_BASE}/cms/admin/static-content/seo-landing-pages`,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data ?? {};
  }

  static async updateSeoLandingPages(data: Record<string, unknown>) {
    const response = await axios.put(
      `${API_BASE}/cms/admin/static-content/seo-landing-pages`,
      data,
      this.getAuthHeaders(),
    );
    return response.data?.data ?? response.data;
  }

  // ==================== TRANSACTIONAL EMAIL TEMPLATES (HTML + preview) ====================

  static async listEmailTemplates(): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      filename: string;
      placeholders: string[];
      hasCustom: boolean;
      updatedAt: string | null;
    }>
  > {
    const response = await axios.get(`${API_BASE}/cms/admin/email-templates`, this.getAuthHeaders());
    return response.data.data;
  }

  static async getEmailTemplate(id: string): Promise<{
    id: string;
    title: string;
    description: string;
    filename: string;
    placeholders: string[];
    sampleVariables: Record<string, string>;
    activeSource: 'database' | 'file';
    html: string;
    fileBaselineHtml: string;
    updatedAt: string | null;
  }> {
    const response = await axios.get(`${API_BASE}/cms/admin/email-templates/${id}`, this.getAuthHeaders());
    return response.data.data;
  }

  static async previewEmailTemplate(
    id: string,
    body: {
      htmlDraft?: string;
      variables?: Record<string, string>;
      sourceFormat?: 'html' | 'mjml';
    }
  ): Promise<{
    html: string;
    validationHints?: { missing: string[]; unknown: string[] };
  }> {
    const response = await axios.post(
      `${API_BASE}/cms/admin/email-templates/${id}/preview`,
      body,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async saveEmailTemplateOverride(
    id: string,
    payload: {
      htmlBody: string;
      sourceFormat?: 'html' | 'mjml';
      skipPlaceholderValidation?: boolean;
      allowUnknownPlaceholders?: boolean;
      changeNote?: string;
    }
  ): Promise<void> {
    await axios.put(`${API_BASE}/cms/admin/email-templates/${id}`, payload, this.getAuthHeaders());
  }

  static async listEmailTemplateVersions(id: string): Promise<
    Array<{
      id: string;
      createdAt: string;
      changeNote: string | null;
      previewSnippet: string;
    }>
  > {
    const response = await axios.get(
      `${API_BASE}/cms/admin/email-templates/${id}/versions`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  static async restoreEmailTemplateVersion(templateId: string, versionId: string): Promise<void> {
    await axios.post(
      `${API_BASE}/cms/admin/email-templates/${templateId}/restore/${versionId}`,
      {},
      this.getAuthHeaders()
    );
  }

  static async revertEmailTemplateToDefault(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cms/admin/email-templates/${id}`, this.getAuthHeaders());
  }
}

