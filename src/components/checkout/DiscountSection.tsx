import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Check, X, Gift, Percent, DollarSign } from 'lucide-react';

interface DiscountSectionProps {
  orderAmount: number;
  onDiscountApplied: (discount: {
    type: 'coupon' | 'referral';
    code: string;
    amount: number;
    description: string;
  }) => void;
  onDiscountRemoved: (type: 'coupon' | 'referral') => void;
  appliedDiscounts: Array<{
    type: 'coupon' | 'referral';
    code: string;
    amount: number;
    description: string;
  }>;
}

const DiscountSection: React.FC<DiscountSectionProps> = ({
  orderAmount,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscounts,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateCoupon = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code,
          user_id: localStorage.getItem('userId'),
          amount: orderAmount,
          order_type: 'order',
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data.is_valid) {
        const discount = {
          type: 'coupon' as const,
          code: code,
          amount: data.data.discount_amount,
          description: `${data.data.coupon?.type === 'percentage' ? `${data.data.coupon.value}%` : `$${data.data.coupon?.value}`} off`,
        };
        onDiscountApplied(discount);
        setCouponCode('');
      } else {
        setError(data.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      setError('Error validating coupon');
    } finally {
      setLoading(false);
    }
  };

  const applyReferral = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/referrals/use-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          referral_code: code,
          user_id: localStorage.getItem('userId'),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // For referral, we might want to show a different message
        // since the actual discount might be applied later
        const discount = {
          type: 'referral' as const,
          code: code,
          amount: 0, // Referral rewards are typically applied after completion
          description: 'Referral code applied - rewards will be credited after order completion',
        };
        onDiscountApplied(discount);
        setReferralCode('');
      } else {
        setError(data.data.message || 'Invalid referral code');
      }
    } catch (error) {
      setError('Error applying referral code');
    } finally {
      setLoading(false);
    }
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      validateCoupon(couponCode.trim());
    }
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referralCode.trim()) {
      applyReferral(referralCode.trim());
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'coupon':
        return <Percent className="w-4 h-4" />;
      case 'referral':
        return <Gift className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const totalDiscount = appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
  const finalAmount = Math.max(0, orderAmount - totalDiscount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gift className="w-5 h-5" />
          <span>Discounts & Referrals</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coupon Section */}
        <div>
          <label htmlFor="coupon-code" className="text-sm font-medium block mb-1">
            Coupon Code
          </label>
          <form onSubmit={handleCouponSubmit} className="flex space-x-2 mt-1">
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !couponCode.trim()}>
              {loading ? 'Applying...' : 'Apply'}
            </Button>
          </form>
        </div>

        {/* Referral Section */}
        <div>
          <label htmlFor="referral-code" className="text-sm font-medium block mb-1">
            Referral Code
          </label>
          <form onSubmit={handleReferralSubmit} className="flex space-x-2 mt-1">
            <Input
              id="referral-code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !referralCode.trim()}>
              {loading ? 'Applying...' : 'Apply'}
            </Button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Applied Discounts */}
        {appliedDiscounts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Applied Discounts</h4>
              {appliedDiscounts.map((discount, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    {getDiscountIcon(discount.type)}
                    <div>
                      <div className="font-medium text-sm">{discount.code}</div>
                      <div className="text-xs text-muted-foreground">
                        {discount.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {discount.amount > 0 && (
                      <Badge variant="secondary">
                        -${discount.amount.toFixed(2)}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDiscountRemoved(discount.type)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Order Summary */}
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${orderAmount.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Savings Indicator */}
        {totalDiscount > 0 && (
          <div className="flex items-center space-x-2 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            <span>You saved ${totalDiscount.toFixed(2)}!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountSection;
