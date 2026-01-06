/**
 * Offers Service
 * API client for offers and promotions
 */

import { api } from './base';

export interface OfferFilters {
  isActive?: boolean;
  offerType?: 'flash' | 'seasonal' | 'category' | 'provider' | 'first_user';
  applicableTo?: 'all' | 'orders' | 'bookings';
  page?: number;
  limit?: number;
}

export interface CreateOfferRequest {
  name: string;
  description: string;
  offerType: 'flash' | 'seasonal' | 'category' | 'provider' | 'first_user';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  applicableTo?: 'all' | 'orders' | 'bookings';
  categories?: string[];
  products?: string[];
  services?: string[];
  providers?: string[];
  isAutoApplied?: boolean;
  code?: string;
  priority?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  userUsageLimit?: number;
  firstOrderOnly?: boolean;
  newUserOnly?: boolean;
}

export class OffersService {
  /**
   * Get all offers (admin)
   */
  static async getOffers(filters?: OfferFilters) {
    const response = await api.get('/offers', { params: filters });
    return response.data;
  }

  /**
   * Get active offers (public)
   */
  static async getActiveOffers(filters?: OfferFilters) {
    const response = await api.get('/offers/active', { params: filters });
    return response.data;
  }

  /**
   * Get offer by ID
   */
  static async getOfferById(id: string) {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  }

  /**
   * Create new offer (admin)
   */
  static async createOffer(data: CreateOfferRequest) {
    const response = await api.post('/offers', data);
    return response.data;
  }

  /**
   * Update offer (admin)
   */
  static async updateOffer(id: string, data: Partial<CreateOfferRequest>) {
    const response = await api.put(`/offers/${id}`, data);
    return response.data;
  }

  /**
   * Delete offer (admin)
   */
  static async deleteOffer(id: string) {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  }

  /**
   * Toggle offer active status (admin)
   */
  static async toggleOfferStatus(id: string) {
    const response = await api.patch(`/offers/${id}/toggle`);
    return response.data;
  }

  /**
   * Get offer statistics (admin)
   */
  static async getOfferStats(id: string) {
    const response = await api.get(`/offers/${id}/stats`);
    return response.data;
  }
}

