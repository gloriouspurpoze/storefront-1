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

/** Booking reviews (from completed bookings) */
export interface BookingReview {
  _id: string;
  bookingId: string;
  customerId?: string;
  professionalId?: string;
  providerId?: string;
  rating: number;
  comment?: string;
  isVerified?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt?: string;
  customer?: { firstName?: string; lastName?: string; email?: string };
  booking?: { service?: { name?: string }; bookingNumber?: string };
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
  async getBookingReviews(params?: { page?: number; limit?: number; rating?: number }) {
    const response = await axios.get<BookingReviewsResponse>(`${API_BASE}/reviews/all`, {
      ...getAuthHeaders(),
      params: { page: 1, limit: 50, ...params },
    });
    return response.data?.data ?? { reviews: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
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
};
