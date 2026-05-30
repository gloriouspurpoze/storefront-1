import React, { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Star } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
import {
  ReviewsService,
  type BookingReview,
  type CategoryFeedbackItem,
} from '../../services/api/reviews.service'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

type TabValue = 'booking' | 'category'

function labelProfessional(ref: BookingReview['professionalId']): string {
  if (!ref) return '—'
  if (typeof ref === 'string') return ref
  const name =
    ref.displayName || [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim() || '—'
  const code = ref.professionalId ? ` · ${ref.professionalId}` : ''
  return `${name}${code}`
}

function labelProvider(ref: BookingReview['providerId']): string {
  if (!ref) return '—'
  if (typeof ref === 'string') return ref
  const name = ref.businessDisplayName || ref.businessName || '—'
  const code = ref.providerId ? ` · ${ref.providerId}` : ''
  return `${name}${code}`
}

function serviceLabel(r: BookingReview): string {
  if (r.serviceName) {
    return r.variantName ? `${r.serviceName} · ${r.variantName}` : r.serviceName
  }
  const b = r.bookingId
  if (b && typeof b === 'object' && 'services' in b) {
    const line = b.services?.[0]
    if (line?.serviceName) {
      return line.variantName ? `${line.serviceName} · ${line.variantName}` : line.serviceName
    }
  }
  return '—'
}

function platformServiceIdLabel(r: BookingReview): string {
  const p = r.platformServiceId
  if (!p) return '—'
  if (typeof p === 'string') return p
  return p._id ?? '—'
}

function labelCustomer(c: BookingReview['customerId']): string {
  if (!c) return '—'
  if (typeof c === 'string') return c
  return (
    [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.email || '—'
  )
}

function customerEmailLine(c: BookingReview['customerId']): string | null {
  if (!c || typeof c === 'string') return null
  return c.email ?? null
}

function StarRating({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <div className="inline-flex text-bloom-coral" role="img" aria-label={`${v} of 5 stars`}>
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
  const [filterRating, setFilterRating] = useState('')
  const [filterProfessionalId, setFilterProfessionalId] = useState('')
  const [filterProviderId, setFilterProviderId] = useState('')
  const [filterPlatformServiceId, setFilterPlatformServiceId] = useState('')

  const loadBookingReviews = async (page: number = 1, skipFilters = false) => {
    setLoadingBooking(true)
    setError(null)
    try {
      const useFilters = !skipFilters
      const ratingStr = useFilters ? filterRating : ''
      const profId = useFilters ? filterProfessionalId : ''
      const provId = useFilters ? filterProviderId : ''
      const svcId = useFilters ? filterPlatformServiceId : ''
      const ratingParsed = ratingStr === '' ? NaN : Number.parseInt(ratingStr, 10)
      const ratingFilter =
        Number.isFinite(ratingParsed) && ratingParsed >= 1 && ratingParsed <= 5
          ? ratingParsed
          : undefined
      const res = await ReviewsService.getBookingReviews({
        page,
        limit: bookingPagination.limit,
        ...(ratingFilter !== undefined ? { rating: ratingFilter } : {}),
        ...(profId.trim() ? { professionalId: profId.trim() } : {}),
        ...(provId.trim() ? { providerId: provId.trim() } : {}),
        ...(svcId.trim() ? { platformServiceId: svcId.trim() } : {}),
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

  const handleApplyBookingFilters = () => {
    loadBookingReviews(1)
  }

  const handleClearBookingFilters = () => {
    setFilterRating('')
    setFilterProfessionalId('')
    setFilterProviderId('')
    setFilterPlatformServiceId('')
    loadBookingReviews(1, true)
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
          <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <label htmlFor="review-filter-rating" className="text-xs font-medium text-muted-foreground">
                Rating
              </label>
              <select
                id="review-filter-rating"
                className={cn(
                  'flex h-9 w-full min-w-[10rem] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} stars
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label htmlFor="review-filter-pro" className="text-xs font-medium text-muted-foreground">
                Professional (Mongo ID)
              </label>
              <Input
                id="review-filter-pro"
                placeholder="Professional ObjectId"
                value={filterProfessionalId}
                onChange={(e) => setFilterProfessionalId(e.target.value)}
              />
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label htmlFor="review-filter-provider" className="text-xs font-medium text-muted-foreground">
                Provider / business (Mongo ID)
              </label>
              <Input
                id="review-filter-provider"
                placeholder="ServiceProvider ObjectId"
                value={filterProviderId}
                onChange={(e) => setFilterProviderId(e.target.value)}
              />
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label htmlFor="review-filter-service" className="text-xs font-medium text-muted-foreground">
                Platform service (Mongo ID)
              </label>
              <Input
                id="review-filter-service"
                placeholder="PlatformService ObjectId"
                value={filterPlatformServiceId}
                onChange={(e) => setFilterPlatformServiceId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleApplyBookingFilters}>
                Apply filters
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleClearBookingFilters}>
                Clear
              </Button>
            </div>
          </div>
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="whitespace-nowrap">Service ID</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[18rem]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingReviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <span>{labelCustomer(r.customerId)}</span>
                        {customerEmailLine(r.customerId) && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {customerEmailLine(r.customerId)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[14rem] align-top text-sm">
                        <div className="space-y-1">
                          <div>
                            <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Provider
                            </span>
                            <span className="break-words">{labelProvider(r.providerId)}</span>
                          </div>
                          <div>
                            <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Professional
                            </span>
                            <span className="break-words">{labelProfessional(r.professionalId)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[12rem] align-top text-sm break-words">
                        {serviceLabel(r)}
                      </TableCell>
                      <TableCell className="max-w-[7rem] align-top font-mono text-[11px] text-muted-foreground break-all">
                        {platformServiceIdLabel(r)}
                      </TableCell>
                      <TableCell>
                        <StarRating value={r.rating ?? 0} />
                      </TableCell>
                      <TableCell className="max-w-[18rem] align-top text-sm">{r.comment || '—'}</TableCell>
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
