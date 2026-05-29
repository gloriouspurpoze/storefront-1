import axios from 'axios';

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

/** Populated professional on review list (Mongo ref: Professional). */
export interface BookingReviewProfessional {
  _id?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImage?: string;
  averageRating?: number;
  /** Human-readable pro code e.g. PRO-xxx */
  professionalId?: string;
}

/** Populated business/provider on review list (Mongo ref: ServiceProvider). */
export interface BookingReviewProvider {
  _id?: string;
  businessName?: string;
  businessDisplayName?: string;
  /** Business code e.g. BIZ-xxx */
  providerId?: string;
  logo?: string;
  averageRating?: number;
  totalRatings?: number;
}

export interface BookingReviewBookingEmbed {
  _id?: string;
  services?: Array<{ serviceName?: string; variantName?: string; serviceId?: string }>;
  scheduledDate?: string;
}

export type ReviewSource = 'booking' | 'admin' | 'imported'

/** Booking reviews (from completed bookings) plus admin-curated testimonials. */
export interface BookingReview {
  _id: string;
  id?: string;
  bookingId?: string | BookingReviewBookingEmbed;
  /** Populated customer User when returned from admin list API */
  customerId?: string | { firstName?: string; lastName?: string; email?: string; profilePicture?: string };
  professionalId?: string | BookingReviewProfessional;
  providerId?: string | BookingReviewProvider;
  /** Snapshot at review time + optional populated PlatformService */
  platformServiceId?: string | { _id?: string };
  serviceName?: string;
  variantName?: string;
  rating: number;
  comment?: string;
  images?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
  isAdminCurated?: boolean;
  customerName?: string;
  customerAvatar?: string;
  customerLocation?: string;
  source?: ReviewSource;
  helpfulCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

export interface AdminCreateReviewPayload {
  platformServiceId: string;
  rating: number;
  customerName: string;
  comment?: string;
  customerAvatar?: string;
  customerLocation?: string;
  serviceName?: string;
  variantName?: string;
  images?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
}

export interface AdminUpdateReviewPayload {
  rating?: number;
  comment?: string;
  customerName?: string;
  customerAvatar?: string;
  customerLocation?: string;
  serviceName?: string;
  variantName?: string;
  images?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
}

export interface BookingReviewsResponse {
  success: boolean;
  data?: {
    reviews: BookingReview[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

/** Category feedback (from /feedback/:categorySlug form, shown on services page) */
export interface CategoryFeedbackItem {
  id: string;
  categorySlug: string;
  categoryName: string | null;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface CategoryFeedbackResponse {
  success: boolean;
  feedback: CategoryFeedbackItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const ReviewsService = {
  async getBookingReviews(params?: {
    page?: number
    limit?: number
    rating?: number
    professionalId?: string
    providerId?: string
    platformServiceId?: string
  }) {
    const page = params?.page ?? 1
    const limit = Math.min(100, Math.max(1, params?.limit ?? 50))
    const response = await axios.get<BookingReviewsResponse>(`${API_BASE}/reviews/all`, {
      ...getAuthHeaders(),
      params: { ...params, page, limit },
    })
    return (
      response.data?.data ?? {
        reviews: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      }
    )
  },

  async getCategoryFeedback(params?: { page?: number; limit?: number }) {
    const response = await axios.get<CategoryFeedbackResponse>(`${API_BASE}/feedback/all`, {
      ...getAuthHeaders(),
      params: { page: 1, limit: 50, ...params },
    });
    return {
      feedback: response.data?.feedback ?? [],
      pagination: response.data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
    };
  },

  /**
   * Admin: list every review for a platform service (verified + curated +
   * pending), with rating distribution. Backs the "Customer reviews" admin tab.
   */
  async getAdminServiceReviews(
    platformServiceId: string,
    params?: { page?: number; limit?: number },
  ): Promise<{
    reviews: BookingReview[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    stats: ReviewStats;
  }> {
    const page = params?.page ?? 1;
    const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
    const response = await axios.get<{
      success: boolean;
      data?: {
        reviews: BookingReview[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        stats: ReviewStats;
      };
    }>(`${API_BASE}/reviews/admin/service/${platformServiceId}`, {
      ...getAuthHeaders(),
      params: { page, limit },
    });
    return (
      response.data?.data ?? {
        reviews: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      }
    );
  },

  /** Admin: create an admin-curated review (testimonial) for a service. */
  async adminCreateReview(payload: AdminCreateReviewPayload): Promise<BookingReview> {
    const response = await axios.post<{ success: boolean; data?: { review: BookingReview } }>(
      `${API_BASE}/reviews/admin`,
      payload,
      getAuthHeaders(),
    );
    const review = response.data?.data?.review;
    if (!review) throw new Error('Invalid response from review create endpoint');
    return review;
  },

  /** Admin: update any review (rating, copy, verification, featured flag…). */
  async adminUpdateReview(
    reviewId: string,
    payload: AdminUpdateReviewPayload,
  ): Promise<BookingReview> {
    const response = await axios.put<{ success: boolean; data?: { review: BookingReview } }>(
      `${API_BASE}/reviews/admin/${reviewId}`,
      payload,
      getAuthHeaders(),
    );
    const review = response.data?.data?.review;
    if (!review) throw new Error('Invalid response from review update endpoint');
    return review;
  },

  /** Admin: delete any review. */
  async adminDeleteReview(reviewId: string): Promise<void> {
    await axios.delete(`${API_BASE}/reviews/admin/${reviewId}`, getAuthHeaders());
  },
};
