import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Pagination,
  Paper,
  Rating,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { Refresh as RefreshIcon, Star as StarIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ReviewsService,
  type BookingReview,
  type CategoryFeedbackItem,
} from '../../services/api/reviews.service';
import { format } from 'date-fns';

type TabValue = 'booking' | 'category';

export default function ReviewsManagement() {
  const [tab, setTab] = useState<TabValue>('booking');
  const [bookingReviews, setBookingReviews] = useState<BookingReview[]>([]);
  const [bookingPagination, setBookingPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [categoryFeedback, setCategoryFeedback] = useState<CategoryFeedbackItem[]>([]);
  const [categoryPagination, setCategoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookingReviews = async (page: number = 1) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await ReviewsService.getBookingReviews({
        page,
        limit: bookingPagination.limit,
      });
      setBookingReviews(res.reviews ?? []);
      setBookingPagination(prev => ({
        ...prev,
        ...(res.pagination || {}),
        page,
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load booking reviews');
      setBookingReviews([]);
    } finally {
      setLoadingBooking(false);
    }
  };

  const loadCategoryFeedback = async (page: number = 1) => {
    setLoadingCategory(true);
    setError(null);
    try {
      const res = await ReviewsService.getCategoryFeedback({
        page,
        limit: categoryPagination.limit,
      });
      setCategoryFeedback(res.feedback ?? []);
      setCategoryPagination(prev => ({
        ...prev,
        ...(res.pagination || {}),
        page,
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load category feedback');
      setCategoryFeedback([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  useEffect(() => {
    loadBookingReviews(bookingPagination.page);
  }, []);

  useEffect(() => {
    if (tab === 'category') {
      loadCategoryFeedback(categoryPagination.page);
    }
  }, [tab]);

  const handleRefresh = () => {
    if (tab === 'booking') loadBookingReviews(bookingPagination.page);
    else loadCategoryFeedback(categoryPagination.page);
  };

  const loading = tab === 'booking' ? loadingBooking : loadingCategory;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Reviews"
        subtitle="View all booking reviews and category feedback"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v: TabValue) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Booking reviews" value="booking" />
        <Tab label="Category feedback" value="category" />
      </Tabs>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {tab === 'booking' && (
        <>
          {loadingBooking ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
              <CircularProgress />
            </Box>
          ) : bookingReviews.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <StarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No booking reviews yet.</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer / Booking</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookingReviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        {r.createdAt
                          ? format(new Date(r.createdAt), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {r.customer
                          ? [r.customer.firstName, r.customer.lastName].filter(Boolean).join(' ') || r.customer.email || '—'
                          : r.booking?.bookingNumber || '—'}
                        {r.booking?.service?.name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {r.booking.service.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Rating value={r.rating ?? 0} readOnly size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{r.comment || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bookingPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination
                    count={bookingPagination.totalPages}
                    page={bookingPagination.page}
                    onChange={(_, p) => loadBookingReviews(p)}
                    color="primary"
                  />
                </Box>
              )}
            </TableContainer>
          )}
        </>
      )}

      {tab === 'category' && (
        <>
          {loadingCategory ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
              <CircularProgress />
            </Box>
          ) : categoryFeedback.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <StarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No category feedback yet.</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryFeedback.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.createdAt
                          ? format(new Date(f.createdAt), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {f.categoryName || f.categorySlug || '—'}
                      </TableCell>
                      <TableCell>{f.customerName || '—'}</TableCell>
                      <TableCell>
                        <Rating value={f.rating ?? 0} readOnly size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{f.comment || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {categoryPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination
                    count={categoryPagination.totalPages}
                    page={categoryPagination.page}
                    onChange={(_, p) => loadCategoryFeedback(p)}
                    color="primary"
                  />
                </Box>
              )}
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}
