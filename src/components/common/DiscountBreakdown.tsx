/**
 * Discount Breakdown Component
 * Shows all applied discounts and savings
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import {
  LocalOffer as OfferIcon,
  CardGiftcard as CouponIcon,
  People as ReferralIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../lib/utils';

export interface DiscountBreakdownProps {
  subtotal: number;
  offer?: {
    amount: number;
    name?: string;
  };
  coupon?: {
    amount: number;
    code?: string;
  };
  referral?: {
    amount: number;
    code?: string;
  };
  shipping?: number;
  tax?: number;
  finalTotal: number;
}

export function DiscountBreakdown({
  subtotal,
  offer,
  coupon,
  referral,
  shipping = 0,
  tax = 0,
  finalTotal,
}: DiscountBreakdownProps) {
  const totalDiscount = (offer?.amount || 0) + (coupon?.amount || 0) + (referral?.amount || 0);
  const totalSavings = totalDiscount;

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Price Breakdown
        </Typography>

        {/* Subtotal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Subtotal:</Typography>
          <Typography sx={{ fontWeight: 500 }}>
            {formatCurrency(subtotal)}
          </Typography>
        </Box>

        {/* Discounts Section */}
        {totalDiscount > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'success.main' }}>
              Discounts Applied
            </Typography>

            {/* Auto-Applied Offer */}
            {offer && offer.amount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <OfferIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    {offer.name || 'Special Offer'}
                  </Typography>
                  <Chip label="Auto-applied" size="small" color="primary" variant="outlined" />
                </Box>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  -{formatCurrency(offer.amount)}
                </Typography>
              </Box>
            )}

            {/* Coupon Code */}
            {coupon && coupon.amount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CouponIcon fontSize="small" color="success" />
                  <Typography variant="body2">
                    Coupon: {coupon.code}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  -{formatCurrency(coupon.amount)}
                </Typography>
              </Box>
            )}

            {/* Referral Bonus */}
            {referral && referral.amount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReferralIcon fontSize="small" color="info" />
                  <Typography variant="body2">
                    Referral Bonus
                  </Typography>
                  {referral.code && (
                    <Chip label={referral.code} size="small" variant="outlined" />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  -{formatCurrency(referral.amount)}
                </Typography>
              </Box>
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Shipping */}
        {shipping > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Shipping:</Typography>
            <Typography>{formatCurrency(shipping)}</Typography>
          </Box>
        )}

        {/* Tax */}
        {tax > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Tax (10%):</Typography>
            <Typography>{formatCurrency(tax)}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Final Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatCurrency(finalTotal)}
          </Typography>
        </Box>

        {/* Savings Alert */}
        {totalSavings > 0 && (
          <Alert 
            severity="success" 
            icon={<SavingsIcon />}
            sx={{ mt: 2 }}
          >
            <Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                You saved {formatCurrency(totalSavings)}!
              </Typography>
              {offer && offer.amount > 0 && (
                <Typography variant="caption">
                  • {formatCurrency(offer.amount)} from {offer.name || 'offer'}
                </Typography>
              )}
              {coupon && coupon.amount > 0 && (
                <Typography variant="caption">
                  • {formatCurrency(coupon.amount)} from coupon {coupon.code}
                </Typography>
              )}
              {referral && referral.amount > 0 && (
                <Typography variant="caption">
                  • {formatCurrency(referral.amount)} from referral bonus
                </Typography>
              )}
            </Stack>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

