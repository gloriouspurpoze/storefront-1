import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  MousePointerClick,
  FolderTree,
} from 'lucide-react'
import { Category } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import { cn } from '../../lib/utils'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Input,
  Label,
  Badge,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface EnhancedCategoryListProps {
  onCategorySelect?: (category: Category) => void
  onCategoryEdit?: (category: Category) => void
  onCategoryDelete?: (category: Category) => void
  onCategoryCreate?: () => void
  showStats?: boolean
  allowSelection?: boolean
  selectedCategories?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

function typeBadgeVariant(
  type: Category['type']
): 'default' | 'secondary' | 'outline' {
  if (type === 'service') return 'default'
  if (type === 'product') return 'secondary'
  return 'outline'
}

export default function EnhancedCategoryList({
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryCreate: _onCategoryCreate,
  showStats = true,
  allowSelection: _allowSelection = false,
  selectedCategories: _selectedCategories = [],
  onSelectionChange: _onSelectionChange,
}: EnhancedCategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service' | 'both'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | '0' | '1' | '2' | '3'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'viewCount' | 'clickCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [page] = useState(0)
  const [rowsPerPage] = useState(12)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const query = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        category_type: typeFilter === 'all' ? undefined : typeFilter,
        level: levelFilter === 'all' ? undefined : parseInt(levelFilter, 10),
        sort_by: sortBy,
        sort_order: sortOrder,
      }

      const response = await CategoriesService.getCategories(query)
      setCategories(response.data.categories)
    } catch (err) {
      setError('Failed to load categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    rowsPerPage,
    searchTerm,
    statusFilter,
    typeFilter,
    levelFilter,
    sortBy,
    sortOrder,
  ])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const desc = category.description ?? ''
      const matchesSearch =
        !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'inactive' && !category.isActive)

      const matchesType = typeFilter === 'all' || category.type === typeFilter
      const matchesLevel = levelFilter === 'all' || category.level.toString() === levelFilter

      return matchesSearch && matchesStatus && matchesType && matchesLevel
    })
  }, [categories, searchTerm, statusFilter, typeFilter, levelFilter])

  const renderCategoryCard = (category: Category) => (
      <Card
        key={category.id}
        className={cn(
          'flex h-full flex-col border-border/60 bg-gradient-to-br from-background/95 to-primary/[0.02] transition-all duration-300',
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg'
        )}
      >
        <CardContent className="flex-1 pt-6">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border/50">
              <AvatarFallback
                className={cn(
                  'text-lg font-medium',
                  category.colorCode
                    ? 'text-white'
                    : 'bg-primary text-primary-foreground'
                )}
                style={
                  category.colorCode ? { backgroundColor: category.colorCode } : undefined
                }
              >
                <FolderTree className="h-5 w-5" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold leading-tight">{category.name}</h3>
              <p className="truncate text-sm text-muted-foreground">{category.description || '—'}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCategorySelect?.(category)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCategoryEdit?.(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onCategoryDelete?.(category)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge variant={typeBadgeVariant(category.type)} className="capitalize">
              {category.type}
            </Badge>
            <Badge variant="outline">Level {category.level}</Badge>
            <Badge variant={category.isActive ? 'success' : 'destructive'}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {showStats && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-default gap-1 pl-1.5 pr-2 font-normal">
                    <Eye className="h-3 w-3" aria-hidden />
                    {category.viewCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Views</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-default gap-1 pl-1.5 pr-2 font-normal">
                    <MousePointerClick className="h-3 w-3" aria-hidden />
                    {category.clickCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Clicks</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-default gap-1 pl-1.5 pr-2 font-normal">
                    <FolderTree className="h-3 w-3" aria-hidden />
                    {category.childrenCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Children</TooltipContent>
              </Tooltip>
            </div>
          )}

          {category.breadcrumbs && category.breadcrumbs.length > 1 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Path: {category.breadcrumbs.join(' > ')}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 border-t bg-muted/20 px-6 py-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onCategorySelect?.(category)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onCategoryEdit?.(category)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        </CardFooter>
      </Card>
  )

  const renderSkeleton = () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-[80%] max-w-[80%] animate-pulse rounded bg-muted" />
                <div className="h-3 w-[60%] max-w-[60%] animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-8 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <div className="mb-6 rounded-lg border border-border/50 bg-muted/30 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label htmlFor="cat-search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cat-search"
                  className="pl-9"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full min-w-[140px] sm:w-[150px]">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full min-w-[140px] sm:w-[150px]">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full min-w-[140px] sm:w-[150px]">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Level</Label>
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as typeof levelFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0">Root</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full min-w-[140px] sm:w-[150px]">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="viewCount">Views</SelectItem>
                  <SelectItem value="clickCount">Clicks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full min-w-[100px] sm:w-auto"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Filter className="mr-2 h-4 w-4" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>

        {loading ? (
          renderSkeleton()
        ) : error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {filteredCategories.map((category) => (
              <div key={category.id}>{renderCategoryCard(category)}</div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
