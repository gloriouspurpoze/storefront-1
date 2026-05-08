import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Tag,
  Clock,
  User,
  CheckCircle2,
  Search,
  ListFilter,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  useToast,
} from '../../components/ui'
import { BlogService } from '../../services/api/blog.service'
import type { BlogPost, BlogCategory, BlogListResponse } from '../../types/cms.types'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 50

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'secondary'
    case 'scheduled':
      return 'warning'
    case 'archived':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function BlogManagement() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<BlogListResponse['pagination']>()
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await BlogService.getCategories()
        if (!cancelled) setCategories(list.filter((c) => c.isActive !== false))
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const params: Parameters<typeof BlogService.getPosts>[0] = {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(tagFilter.trim() ? { tag: tagFilter.trim() } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(featuredOnly ? { isFeatured: true } : {}),
      }
      const { posts: list, pagination: meta } = await BlogService.getPosts(params)

      if (list.length === 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
        return
      }

      setPosts(list ?? [])
      setPagination(meta)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        'Failed to load posts'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      setPosts([])
      setPagination(undefined)
    } finally {
      setLoading(false)
    }
  }, [toast, page, statusFilter, categoryFilter, tagFilter, debouncedSearch, featuredOnly])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const totalPages = useMemo(() => {
    if (!pagination) return 1
    if (pagination.totalPages != null && pagination.totalPages > 0) return pagination.totalPages
    if (pagination.total != null && pagination.limit) {
      return Math.max(1, Math.ceil(pagination.total / pagination.limit))
    }
    return 1
  }, [pagination])

  const hasActiveFilters =
    !!statusFilter ||
    !!categoryFilter ||
    !!tagFilter.trim() ||
    !!debouncedSearch ||
    featuredOnly

  const resetFilters = () => {
    setStatusFilter('')
    setCategoryFilter('')
    setTagFilter('')
    setSearchInput('')
    setDebouncedSearch('')
    setFeaturedOnly(false)
    setPage(1)
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await BlogService.deletePost(deleteTarget._id)
      toast({ title: 'Success', description: 'Blog post deleted' })
      setDeleteTarget(null)
      await fetchPosts()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        'Failed to delete'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Blog Management"
          subtitle="Filter and search posts via the API. Up to 50 per page — use pagination to see the rest."
          action={
            <Button
              className="rounded-md"
              onClick={() => navigate('/cms/blogs/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Post
            </Button>
          }
        />

        <Card className="mb-6 rounded-lg">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Filters</span>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                  Clear all
                </Button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search title or content…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="sr-only">Status</Label>
                <Select
                  value={statusFilter || '__all__'}
                  onValueChange={(v) => {
                    setStatusFilter(v === '__all__' ? '' : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="sr-only">Category</Label>
                <Select
                  value={categoryFilter || '__all__'}
                  onValueChange={(v) => {
                    setCategoryFilter(v === '__all__' ? '' : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="tag-filter" className="sr-only">
                  Tag
                </Label>
                <Input
                  id="tag-filter"
                  className="h-9"
                  placeholder="Exact tag"
                  value={tagFilter}
                  onChange={(e) => {
                    setTagFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  id="featured-only"
                  checked={featuredOnly}
                  onCheckedChange={(checked) => {
                    setFeaturedOnly(checked)
                    setPage(1)
                  }}
                />
                <Label htmlFor="featured-only" className="text-sm font-normal">
                  Featured only
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {pagination ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {posts.length} of {pagination.total ?? posts.length} post
            {(pagination.total ?? 0) !== 1 ? 's' : ''}
            {totalPages > 1 ? ` · Page ${pagination.page ?? page} of ${totalPages}` : ''}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-muted-foreground">
                {hasActiveFilters ? 'No posts match your filters' : 'No blog posts found'}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try clearing filters or broadening your search.'
                  : 'Create your first blog post to get started'}
              </p>
              {hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/cms/blogs/new')}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <Card
                  key={post._id}
                  className="border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div
                      className={cn(
                        'grid grid-cols-1 items-center gap-6',
                        post.featuredImage ? 'sm:grid-cols-12' : 'sm:grid-cols-12',
                      )}
                    >
                      {post.featuredImage ? (
                        <div className="sm:col-span-3">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="h-[150px] w-full rounded-lg border border-border/80 object-cover"
                          />
                        </div>
                      ) : null}
                      <div className={cn(post.featuredImage ? 'sm:col-span-7' : 'sm:col-span-10')}>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-5 w-5 shrink-0 text-primary" />
                            <h3 className="text-lg font-semibold">{post.title}</h3>
                            <Badge variant={statusBadgeVariant(post.status)} className="capitalize">
                              {post.status}
                            </Badge>
                            {post.isFeatured ? (
                              <Badge variant="warning" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Featured
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {post.excerpt || 'No excerpt'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Tag className="h-3.5 w-3.5" />
                                  {post.category && typeof post.category === 'object'
                                    ? (post.category as { name?: string }).name
                                    : 'Uncategorized'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Category</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="h-3.5 w-3.5" />
                                  {post.viewCount ?? 0} views
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Views</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {post.readTime ?? 0} min read
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Read time</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3.5 w-3.5" />
                                  {post.author?.name ?? '—'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Author</TooltipContent>
                            </Tooltip>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {Array.isArray(post.tags) && post.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.tags.map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-primary/20 bg-primary/5 font-medium text-primary"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-row justify-start gap-1 sm:col-span-2 sm:justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                              onClick={() => navigate(`/cms/blogs/${post._id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() => setDeleteTarget(post)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  First
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  Last
                </Button>
              </div>
            ) : null}
          </>
        )}

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete blog post?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete &quot;{deleteTarget?.title}&quot;. This action cannot be undone.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
