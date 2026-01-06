import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, CircularProgress, Alert, Grid } from '@mui/material';
import { LocalOffer, TrendingUp, Star } from '@mui/icons-material';
import { OffersService } from '../../services/api/offers.service';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  code: string;
  applicable_to: string;
}

interface AvailableOffersProps {
  type: 'booking' | 'order';
  onOfferSelect?: (offer: Offer) => void;
}

export function AvailableOffers({ type, onOfferSelect }: AvailableOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [type]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // Map type to API format
      const applicableTo = type === 'order' ? 'orders' : 'bookings';
      const response: any = await OffersService.getActiveOffers({ applicableTo });
      
      if (response && response.success) {
        setOffers(response.data || []);
      } else {
        setError('Failed to load offers');
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (offers.length === 0) {
    return (
      <Alert severity="info">
        No offers available at the moment. Check back later!
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Offers
      </Typography>
      <Grid container spacing={2}>
        {offers.map((offer) => (
          <Grid size={{ xs: 12, md: 6 }} key={offer.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: onOfferSelect ? 'pointer' : 'default',
                '&:hover': onOfferSelect ? {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                } : {}
              }}
              onClick={() => onOfferSelect && onOfferSelect(offer)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6">{offer.title}</Typography>
                  <Chip
                    icon={<LocalOffer />}
                    label={offer.discount_type === 'percentage' 
                      ? `${offer.discount_value}% OFF` 
                      : `$${offer.discount_value} OFF`
                    }
                    color="primary"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {offer.description}
                </Typography>
                <Chip label={`Code: ${offer.code}`} size="small" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
