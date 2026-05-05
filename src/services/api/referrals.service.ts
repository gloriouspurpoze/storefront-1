/**
 * Referrals admin & program settings — `/api/referrals/*`
 */

import { api } from './base';

const silentRead = { showSuccessToast: false, showLoading: false } as const;

export interface ReferralRow {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  reward_type: 'discount' | 'credit' | 'cashback' | 'free_service';
  referrer_reward: number;
  referee_reward: number;
  referrer_reward_currency: string;
  referee_reward_currency: string;
  completion_requirement: string;
  minimum_spend?: number;
  expires_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralsListResponse {
  referrals: ReferralRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReferralStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  expired_referrals: number;
  total_rewards_given: number;
  total_referrers: number;
  total_referees: number;
  top_referrers: Array<{
    user_id: string;
    referral_count: number;
    total_rewards: number;
  }>;
  recent_referrals: ReferralRow[];
}

export interface ReferralProgramSettings {
  firstSignupCreditEnabled: boolean;
  firstSignupCreditAmountPaise: number;
  /** `null` = use env `REFERRAL_DEFAULT_REFEREE_REWARD_PAISE` (backend). */
  referralDefaultRefereeRewardPaise: number | null;
  referralDefaultReferrerRewardPaise: number | null;
  referralMinQualifyingSpendPaise: number | null;
}

export interface ReferralWalletPayoutRow {
  id: string;
  user_id: string;
  role: 'referee' | 'referrer';
  amount_rupees: number;
  description: string;
  referral_id?: string;
  referral_code?: string;
  order_id?: string;
  booking_id?: string;
  created_at: string;
}

export interface ReferralLedgerRewardRow {
  id: string;
  referral_id: string;
  user_id: string;
  reward_type: string;
  amount: number;
  currency: string;
  status: string;
  credited_at?: string;
  expires_at?: string;
  order_id?: string;
  booking_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralPayoutReportResponse {
  wallet: {
    items: ReferralWalletPayoutRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  ledger: {
    items: ReferralLedgerRewardRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export interface CreateReferralPayload {
  referrer_id: string;
  referee_id: string;
  reward_type: ReferralRow['reward_type'];
  referrer_reward: number;
  referee_reward: number;
  referrer_reward_currency?: string;
  referee_reward_currency?: string;
  completion_requirement?: 'first_order' | 'first_booking' | 'first_payment' | 'minimum_spend';
  minimum_spend?: number;
  expires_at?: string;
}

export class ReferralsService {
  static async getAdminReferrals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    referrer_id?: string;
    referee_id?: string;
  }) {
    return api.get<ReferralsListResponse>('/referrals/admin/all', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        ...params,
      },
      ...silentRead,
    });
  }

  static async getStats() {
    return api.get<ReferralStats>('/referrals/stats', { ...silentRead });
  }

  static async getProgramSettings() {
    return api.get<ReferralProgramSettings>('/referrals/admin/program-settings', { ...silentRead });
  }

  static async updateProgramSettings(body: ReferralProgramSettings) {
    return api.put<ReferralProgramSettings>('/referrals/admin/program-settings', body, {
      showSuccessToast: false,
    });
  }

  static async cancelReferral(id: string) {
    return api.put(`/referrals/${id}/cancel`, {}, { showSuccessToast: false });
  }

  static async expireReferral(id: string) {
    return api.put(`/referrals/${id}/expire`, {}, { showSuccessToast: false });
  }

  static async createReferral(body: CreateReferralPayload) {
    return api.post('/referrals/create', body, { showSuccessToast: false });
  }

  static async getPayoutReport(params?: {
    page?: number;
    limit?: number;
    user_id?: string;
    wallet_role?: 'referee' | 'referrer' | 'all';
  }) {
    return api.get<ReferralPayoutReportResponse>('/referrals/admin/payout-report', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        user_id: params?.user_id || undefined,
        wallet_role: params?.wallet_role || undefined,
      },
      ...silentRead,
    });
  }
}
