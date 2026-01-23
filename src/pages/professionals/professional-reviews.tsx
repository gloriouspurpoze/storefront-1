/**
 * ============================================================================
 * PROFESSIONAL REVIEWS & RATINGS PAGE
 * ============================================================================
 * Complete reviews and ratings management for professionals
 * 
 * Features:
 * - View all customer reviews
 * - Respond to reviews
 * - Filter by rating, date
 * - View rating statistics
 * - Rating analytics and trends
 * 
 * @author CTO Team
 * @date January 23, 2026
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Grid,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Rating,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Star as StarIcon,
  Reply as ReplyIcon,
  FilterList as FilterIcon,
  TrendingUp,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  AccessTime,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { apiClient } from '../../services/apiClient'
import { addToast } from '../../store/slices/uiSlice'
import { getInitials } from '../../lib/utils'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Review {
  _id: string
  bookingId: string
  customerId: {
    _id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  rating: number
  comment: string
  response?: string
  respondedAt?: string
  createdAt: string
  serviceName?: string
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    [key: number]: number
  }
  recentRatingTrend: Array<{
    month: string
    averageRating: number
    reviewCount: number
  }>
}

export function ProfessionalReviews() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    loadReviews()
    loadStats()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/reviews/professional') as any
      if (response?.success || response?.data?.success) {
        const reviewsData = response.data?.reviews || response.data?.data || response.reviews || []
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      }
    } catch (error: any) {
      console.error('Error loading reviews:', error)
      dispatch(addToast({ 
        message: error.response?.data?.message || 'Failed to load reviews', 
        severity: 'error' 
      }))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/reviews/professional/stats') as any
      if (response?.success || response?.data?.success) {
        setStats(response.data?.stats || response.data || response)
      }
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
  }

  const handleRespondToReview = async () => {
    if (!selectedReview || !responseText.trim()) return

    try {
      const response = await apiClient.post(`/reviews/${selectedReview._id}/respond`, {
        response: responseText,
      }) as any

      if (response?.success || response?.data?.success) {
        dispatch(addToast({ 
          message: 'Response posted successfully!', 
          severity: 'success' 
        }))
        setResponseDialogOpen(false)
        setResponseText('')
        loadReviews()
      }
    } catch (error: any) {
      dispatch(addToast({ 
        message: error.response?.data?.message || 'Failed to post response', 
        severity: 'error' 
      }))
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesRating = filterRating === 'all' || review.rating === filterRating
    const matchesSearch = searchQuery === '' || 
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${review.customerId.firstName} ${review.customerId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRating && matchesSearch
  })

  const ratingDistributionData = stats?.ratingDistribution ? 
    Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
      name: `${rating} Star${rating !== '1' ? 's' : ''}`,
      value: count,
    })) : []

  const COLORS = ['#f59e0b', '#f97316', '#eab308', '#84cc16', '#22c55e']

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'success'
    if (rating >= 3.5) return 'warning'
    return 'error'
  }

  if (loading && reviews.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Reviews & Ratings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer reviews and track your ratings
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <StarIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Rating value={stats.averageRating} precision={0.1} readOnly size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Reviews
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {stats.totalReviews}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer feedback
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <SentimentSatisfied sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Positive (4-5⭐)
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {((stats.ratingDistribution[5] || 0) + (stats.ratingDistribution[4] || 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.totalReviews > 0 
                    ? Math.round((((stats.ratingDistribution[5] || 0) + (stats.ratingDistribution[4] || 0)) / stats.totalReviews) * 100)
                    : 0}% of reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Response Rate
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {reviews.filter(r => r.response).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {reviews.length > 0 
                    ? Math.round((reviews.filter(r => r.response).length / reviews.length) * 100)
                    : 0}% responded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Rating Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratingDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ratingDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Rating Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.recentRatingTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageRating" fill="#2563eb" name="Avg Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Rating</InputLabel>
              <Select
                value={filterRating}
                label="Filter by Rating"
                onChange={(e) => setFilterRating(e.target.value as number | 'all')}
              >
                <MenuItem value="all">All Ratings</MenuItem>
                <MenuItem value={5}>5 Stars</MenuItem>
                <MenuItem value={4}>4 Stars</MenuItem>
                <MenuItem value={3}>3 Stars</MenuItem>
                <MenuItem value={2}>2 Stars</MenuItem>
                <MenuItem value={1}>1 Star</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Reviews List */}
      <Stack spacing={2}>
        {filteredReviews.length === 0 ? (
          <Alert severity="info">No reviews found</Alert>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review._id} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" gap={2}>
                  <Avatar
                    src={review.customerId.profileImage}
                    sx={{ bgcolor: 'primary.main' }}
                  >
                    {getInitials(`${review.customerId.firstName} ${review.customerId.lastName}`)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {review.customerId.firstName} {review.customerId.lastName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Typography>
                          {review.serviceName && (
                            <Chip label={review.serviceName} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                      <Chip 
                        label={`${review.rating}⭐`} 
                        color={getRatingColor(review.rating) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
                      {review.comment}
                    </Typography>
                    {review.response ? (
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="caption" fontWeight={600} color="primary.main">
                            Your Response
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.respondedAt && new Date(review.respondedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{review.response}</Typography>
                      </Paper>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReplyIcon />}
                        onClick={() => {
                          setSelectedReview(review)
                          setResponseDialogOpen(true)
                        }}
                      >
                        Respond to Review
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => {
          setResponseDialogOpen(false)
          setResponseText('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer Review:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Rating value={selectedReview.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {selectedReview.customerId.firstName} {selectedReview.customerId.lastName}
                  </Typography>
                </Box>
                <Typography variant="body2">{selectedReview.comment}</Typography>
              </Paper>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Response"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Thank you for your feedback..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResponseDialogOpen(false)
            setResponseText('')
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRespondToReview}
            disabled={!responseText.trim()}
          >
            Post Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
