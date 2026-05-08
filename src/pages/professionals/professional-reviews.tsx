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
  Loader2,
  Star,
  MessageSquareReply,
  Users,
  Smile,
  TrendingUp,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '../../components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAppDispatch } from '../../store/hooks'
import { apiClient } from '../../services/apiClient'
import { addToast } from '../../store/slices/uiSlice'
import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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

function StarRating({
  value,
  readOnly = true,
  size = 'sm',
}: {
  value: number
  readOnly?: boolean
  size?: 'sm' | 'md'
}) {
  const iconSize = size === 'sm' ? 14 : 18
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = value >= i + 0.5
        return (
          <Star
            key={i}
            className={cn(
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
              readOnly && 'pointer-events-none'
            )}
            size={iconSize}
          />
        )
      })}
    </div>
  )
}

function ratingBadgeVariant(
  rating: number
): 'success' | 'warning' | 'destructive' {
  if (rating >= 4.5) return 'success'
  if (rating >= 3.5) return 'warning'
  return 'destructive'
}

export function ProfessionalReviews() {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    loadReviews()
    loadStats()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = (await apiClient.get('/reviews/professional')) as any
      if (response?.success || response?.data?.success) {
        const reviewsData = response.data?.reviews || response.data?.data || response.reviews || []
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      }
    } catch (error: any) {
      console.error('Error loading reviews:', error)
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to load reviews',
          severity: 'error',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = (await apiClient.get('/reviews/professional/stats')) as any
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
      const response = (await apiClient.post(`/reviews/${selectedReview._id}/respond`, {
        response: responseText,
      })) as any

      if (response?.success || response?.data?.success) {
        dispatch(
          addToast({
            message: 'Response posted successfully!',
            severity: 'success',
          })
        )
        setResponseDialogOpen(false)
        setResponseText('')
        loadReviews()
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to post response',
          severity: 'error',
        })
      )
    }
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesRating = filterRating === 'all' || review.rating === filterRating
    const matchesSearch =
      searchQuery === '' ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${review.customerId.firstName} ${review.customerId.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    return matchesRating && matchesSearch
  })

  const ratingDistributionData = stats?.ratingDistribution
    ? Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
        name: `${rating} Star${rating !== '1' ? 's' : ''}`,
        value: count,
      }))
    : []

  const COLORS = ['#f59e0b', '#f97316', '#eab308', '#84cc16', '#22c55e']

  if (loading && reviews.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Reviews & Ratings</h1>
        <p className="text-muted-foreground">Manage customer reviews and track your ratings</p>
      </div>

      {stats && (
        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <Star className="mr-1 h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Average Rating</span>
              </div>
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <div className="mt-2">
                <StarRating value={stats.averageRating} size="sm" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <Users className="mr-1 h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Reviews</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalReviews}</p>
              <p className="mt-1 text-xs text-muted-foreground">Customer feedback</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <Smile className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Positive (4–5★)</span>
              </div>
              <p className="text-3xl font-bold">
                {(stats.ratingDistribution[5] || 0) + (stats.ratingDistribution[4] || 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.totalReviews > 0
                  ? Math.round(
                      (((stats.ratingDistribution[5] || 0) + (stats.ratingDistribution[4] || 0)) /
                        stats.totalReviews) *
                        100
                    )
                  : 0}
                % of reviews
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <TrendingUp className="mr-1 h-4 w-4 text-sky-600" />
                <span className="text-sm text-muted-foreground">Response Rate</span>
              </div>
              <p className="text-3xl font-bold">{reviews.filter((r) => r.response).length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {reviews.length > 0
                  ? Math.round(
                      (reviews.filter((r) => r.response).length / reviews.length) * 100
                    )
                  : 0}
                % responded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Rating Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratingDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name ?? 'Unknown'}: ${(
                        (typeof percent === 'number' ? percent : 0) * 100
                      ).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Rating Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.recentRatingTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="averageRating" fill="#2563eb" name="Avg Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-12 md:items-center">
          <div className="md:col-span-4">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <Select
              value={filterRating === 'all' ? 'all' : String(filterRating)}
              onValueChange={(v) =>
                setFilterRating(v === 'all' ? 'all' : (Number(v) as number))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 text-sm text-muted-foreground">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div
            role="status"
            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm"
          >
            No reviews found
          </div>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review._id} className="rounded-lg border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    {review.customerId.profileImage && (
                      <AvatarImage src={review.customerId.profileImage} alt="" />
                    )}
                    <AvatarFallback>
                      {getInitials(
                        `${review.customerId.firstName} ${review.customerId.lastName}`
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {review.customerId.firstName} {review.customerId.lastName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <StarRating value={review.rating} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          {review.serviceName && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {review.serviceName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={ratingBadgeVariant(review.rating)}>
                        {review.rating}★
                      </Badge>
                    </div>
                    <p className="mb-3 text-sm text-foreground">{review.comment}</p>
                    {review.response ? (
                      <div className="rounded-md border bg-muted/50 p-3">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-primary">Your Response</span>
                          <span className="text-xs text-muted-foreground">
                            {review.respondedAt &&
                              new Date(review.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{review.response}</p>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(review)
                          setResponseDialogOpen(true)
                        }}
                      >
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        Respond to Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={responseDialogOpen}
        onOpenChange={(open) => {
          setResponseDialogOpen(open)
          if (!open) setResponseText('')
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 py-2">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Customer Review</p>
                <div className="rounded-md border bg-muted/50 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StarRating value={selectedReview.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {selectedReview.customerId.firstName} {selectedReview.customerId.lastName}
                    </span>
                  </div>
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank you for your feedback..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResponseDialogOpen(false)
                setResponseText('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRespondToReview} disabled={!responseText.trim()}>
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
