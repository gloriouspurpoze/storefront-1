import React, { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Star } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { PageHeader } from '../../components/common/PageHeader'
import { ReviewsService, type BookingReview, type CategoryFeedbackItem } from '../../services/api/reviews.service'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

type TabValue = 'booking' | 'category'

function StarRating({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <div className="inline-flex text-amber-500" role="img" aria-label={`${v} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn('h-3.5 w-3.5', i < v ? 'fill-current' : 'opacity-20')} />
      ))}
    </div>
  )
}

export default function ReviewsManagement() {
  const [tab, setTab] = useState<TabValue>('booking')
  const [bookingReviews, setBookingReviews] = useState<BookingReview[]>([])
  const [bookingPagination, setBookingPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [categoryFeedback, setCategoryFeedback] = useState<CategoryFeedbackItem[]>([])
  const [categoryPagination, setCategoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBookingReviews = async (page: number = 1) => {
    setLoadingBooking(true)
    setError(null)
    try {
      const res = await ReviewsService.getBookingReviews({
        page,
        limit: bookingPagination.limit,
      })
      setBookingReviews(res.reviews ?? [])
      setBookingPagination((prev) => ({
        ...prev,
        ...(res.pagination || {}),
        page,
      }))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load booking reviews')
      setBookingReviews([])
    } finally {
      setLoadingBooking(false)
    }
  }

  const loadCategoryFeedback = async (page: number = 1) => {
    setLoadingCategory(true)
    setError(null)
    try {
      const res = await ReviewsService.getCategoryFeedback({
        page,
        limit: categoryPagination.limit,
      })
      setCategoryFeedback(res.feedback ?? [])
      setCategoryPagination((prev) => ({
        ...prev,
        ...(res.pagination || {}),
        page,
      }))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load category feedback')
      setCategoryFeedback([])
    } finally {
      setLoadingCategory(false)
    }
  }

  useEffect(() => {
    loadBookingReviews(bookingPagination.page)
  }, [])

  useEffect(() => {
    if (tab === 'category') {
      loadCategoryFeedback(categoryPagination.page)
    }
  }, [tab])

  const handleRefresh = () => {
    if (tab === 'booking') loadBookingReviews(bookingPagination.page)
    else loadCategoryFeedback(categoryPagination.page)
  }

  const loading = tab === 'booking' ? loadingBooking : loadingCategory

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Reviews"
        subtitle="View all booking reviews and category feedback"
        action={
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="mb-4">
        <TabsList>
          <TabsTrigger value="booking">Booking reviews</TabsTrigger>
          <TabsTrigger value="category">Category feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="booking" className="mt-4">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          {loadingBooking ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No booking reviews yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer / Booking</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[20rem]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingReviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell>
                        {r.customer
                          ? [r.customer.firstName, r.customer.lastName].filter(Boolean).join(' ') ||
                            r.customer.email ||
                            '—'
                          : r.booking?.bookingNumber || '—'}
                        {r.booking?.service?.name && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">{r.booking.service.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StarRating value={r.rating ?? 0} />
                      </TableCell>
                      <TableCell className="max-w-[20rem] align-top text-sm">{r.comment || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bookingPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bookingPagination.page <= 1}
                    onClick={() => loadBookingReviews(bookingPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {bookingPagination.page} of {bookingPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bookingPagination.page >= bookingPagination.totalPages}
                    onClick={() => loadBookingReviews(bookingPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="category" className="mt-4">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          {loadingCategory ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categoryFeedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No category feedback yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[20rem]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryFeedback.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.createdAt ? format(new Date(f.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell>{f.categoryName || f.categorySlug || '—'}</TableCell>
                      <TableCell>{f.customerName || '—'}</TableCell>
                      <TableCell>
                        <StarRating value={f.rating ?? 0} />
                      </TableCell>
                      <TableCell className="max-w-[20rem] align-top text-sm">{f.comment || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {categoryPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={categoryPagination.page <= 1}
                    onClick={() => loadCategoryFeedback(categoryPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {categoryPagination.page} of {categoryPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={categoryPagination.page >= categoryPagination.totalPages}
                    onClick={() => loadCategoryFeedback(categoryPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
