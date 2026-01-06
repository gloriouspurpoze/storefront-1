/**
 * Coupons Service
 * API client for coupon management
 */

import { api } from './base';

export interface CouponFilters {
  isActive?: boolean;
  applicableTo?: 'all' | 'orders' | 'bookings';
  page?: number;
  limit?: number;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
  applicableTo?: 'all' | 'orders' | 'bookings';
  categories?: string[];
  products?: string[];
  services?: string[];
  providers?: string[];
}

export interface ValidateCouponRequest {
  subtotal: number;
  type: 'order' | 'booking';
  userId?: string;
}

export class CouponsService {
  /**
   * Get all coupons (admin)
   */
  static async getCoupons(filters?: CouponFilters) {
    const response = await api.get('/coupons', { params: filters });
    return response.data;
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(id: string) {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  }

  /**
   * Get coupon by code
   */
  static async getCouponByCode(code: string) {
    const response = await api.get(`/coupons/code/${code}`);
    return response.data;
  }

  /**
   * Validate coupon
   */
  static async validateCoupon(code: string, params: ValidateCouponRequest) {
    const response = await api.post(`/coupons/validate`, {
      code,
      ...params,
    });
    return response.data;
  }

  /**
   * Create new coupon (admin)
   */
  static async createCoupon(data: CreateCouponRequest) {
    const response = await api.post('/coupons', data);
    return response.data;
  }

  /**
   * Update coupon (admin)
   */
  static async updateCoupon(id: string, data: Partial<CreateCouponRequest>) {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  }

  /**
   * Delete coupon (admin)
   */
  static async deleteCoupon(id: string) {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  }

  /**
   * Toggle coupon active status (admin)
   */
  static async toggleCouponStatus(id: string) {
    const response = await api.patch(`/coupons/${id}/toggle`);
    return response.data;
  }

  /**
   * Get coupon statistics (admin)
   */
  static async getCouponStats(id: string) {
    const response = await api.get(`/coupons/${id}/stats`);
    return response.data;
  }
}

