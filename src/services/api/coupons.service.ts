/**
 * Coupons Service — matches `/api/coupons` (admin CRUD + public validate).
 */

import { api } from './base';

const silentRead = { showSuccessToast: false, showLoading: false } as const;

export interface CouponFilters {
  is_active?: boolean;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CouponListResponse {
  coupons: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCouponPayload {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'first_order';
  value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit?: number;
  user_limit?: number;
  starts_at?: string;
  expires_at?: string;
  applicable_to?: 'all' | 'services' | 'products' | 'bookings';
  applicable_categories?: string[];
  applicable_providers?: string[];
  is_active?: boolean;
}

export interface ValidateCouponParams {
  subtotal: number;
  type: 'order' | 'booking';
  userId?: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: { id?: string; _id?: string; code: string };
  discountAmount: number;
  finalAmount: number;
  message: string;
  error?: string;
}

export class CouponsService {
  static async getCoupons(filters?: CouponFilters) {
    const params: Record<string, unknown> = {
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 200,
      ...(filters?.is_active !== undefined && { is_active: filters.is_active }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.sort_by && { sort_by: filters.sort_by }),
      ...(filters?.sort_order && { sort_order: filters.sort_order }),
    };
    return api.get<CouponListResponse>('/coupons', { params, ...silentRead });
  }

  static async getCouponById(id: string) {
    return api.get(`/coupons/${id}`, { ...silentRead });
  }

  static async getCouponByCode(code: string) {
    return api.get(`/coupons/code/${encodeURIComponent(code)}`, { ...silentRead });
  }

  /** Public validate — GET `/coupons/validate` */
  static async validateCoupon(code: string, params: ValidateCouponParams) {
    return api.get<ValidateCouponResult>('/coupons/validate', {
      params: {
        code: code.trim().toUpperCase(),
        subtotal: params.subtotal,
        type: params.type,
        ...(params.userId ? { userId: params.userId } : {}),
      },
      ...silentRead,
    });
  }

  static async createCoupon(data: AdminCouponPayload) {
    return api.post('/coupons', data, { showSuccessToast: false });
  }

  static async updateCoupon(id: string, data: Partial<AdminCouponPayload>) {
    return api.put(`/coupons/${id}`, data, { showSuccessToast: false });
  }

  static async deleteCoupon(id: string) {
    return api.delete(`/coupons/${id}`, { showSuccessToast: false });
  }

  static async getCouponStats() {
    return api.get('/coupons/stats', { ...silentRead });
  }
}
