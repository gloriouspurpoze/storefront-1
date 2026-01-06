/**
 * Coupon Input Component
 * Allows users to enter and apply coupon codes
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  CardGiftcard as CouponIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { CouponsService } from '../../services/api/coupons.service';

export interface CouponInputProps {
  subtotal: number;
  onCouponApplied: (coupon: { code: string; discount: number; couponId: string }) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
  appliedCouponCode?: string;
}

export function CouponInput({
  subtotal,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  appliedCouponCode,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(!!appliedCouponCode);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate coupon
      const response = await CouponsService.validateCoupon(code.toUpperCase(), {
        subtotal,
        type: 'order',
      });

      if ((response as any).success && (response as any).data.valid) {
        const { coupon, discount } = (response as any).data;
        onCouponApplied({
          code: coupon.code,
          discount,
          couponId: coupon.id,
        });
        setApplied(true);
        setError(null);
      } else {
        setError((response as any).data.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setApplied(false);
    setError(null);
    onCouponRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  if (applied) {
    return (
      <Box>
        <Chip
          icon={<CheckIcon />}
          label={`Coupon Applied: ${appliedCouponCode || code}`}
          onDelete={disabled ? undefined : handleRemove}
          deleteIcon={<CloseIcon />}
          color="success"
          sx={{ mb: 1 }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          fullWidth
          size="small"
          label="Coupon Code"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          disabled={disabled || loading}
          error={!!error}
          InputProps={{
            startAdornment: <CouponIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={disabled || loading || !code.trim()}
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Apply'}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

