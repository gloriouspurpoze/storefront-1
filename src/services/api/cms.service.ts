import axios from 'axios';

// API_BASE should include /api (e.g., http://localhost:8005/api)
// Endpoints should NOT include /api prefix (e.g., /cms/admin/testimonials)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * CMS API Service
 * Centralized service for all CMS-related API calls
 */
export class CMSService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
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
  }) {
    const response = await axios.get(`${API_BASE}/cms/admin/media`, {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.data;
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
}

