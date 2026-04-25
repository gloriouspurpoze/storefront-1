import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Pencil,
  Eye,
  Trash2,
  Plus,
  LayoutGrid,
  TrendingUp,
  ArrowLeftRight,
} from 'lucide-react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar'
import { CategoriesService } from '../../services/api/categories.service'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import type { Category } from '../../types'
import { cn } from '../../lib/utils'

const SCOPES = new Set(['products', 'services'])

type CategoryScope = 'products' | 'services'

function getAppliesToLabel(category: Category): { label: string; plain: 'product' | 'service' | 'both' } {
  const t = (category.type || category.categoryType || 'product') as 'product' | 'service' | 'both'
  if (t === 'both') return { label: 'Products & services', plain: 'both' }
  if (t === 'service') return { label: 'Services only', plain: 'service' }
  return { label: 'Store products only', plain: 'product' }
}

function appliesBadgeClass(t: 'product' | 'service' | 'both') {
  if (t === 'product') return 'bg-primary/15 text-primary border-primary/30'
  if (t === 'service') return 'bg-secondary text-secondary-foreground'
  return 'border-border'
}

export function CategoriesList() {
  const navigate = useNavigate()
  const { scope: rawScope } = useParams<{ scope: string }>()
  const isValidScope =
    rawScope != null && SCOPES.has(rawScope) && (rawScope === 'products' || rawScope === 'services')
  const scope: CategoryScope | null = isValidScope ? (rawScope as CategoryScope) : null

  const dispatch = useAppDispatch()
  const confirm = useAppConfirm()

  const [allRows, setAllRows] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const loadAll = useCallback(async () => {
    if (!scope) return
    try {
      setIsLoading(true)
      setError(null)
      const list =
        scope === 'services'
          ? await CategoriesService.getCategoriesForServiceUIs({ page: 1, limit: 2000 })
          : await CategoriesService.getCategoriesForProductUIs({ page: 1, limit: 2000 })
      setAllRows(list)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [scope])

  useEffect(() => {
    if (!scope) return
    setPage(0)
  }, [searchTerm, scope])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    )
  }, [allRows, searchTerm])

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  )

  const stats = useMemo(() => {
    const active = filtered.filter((c) => {
      const a =
        (c as any).is_active !== undefined ? (c as any).is_active : c.isActive ?? c.status === 'active'
      return a
    }).length
    return { total: filtered.length, active, inactive: filtered.length - active }
  }, [filtered])

  const getCategoryId = (category: Category): string => {
    return category.id || (category as any)._id || ''
  }

  const handleEdit = (category: Category) => {
    if (!scope) return
    const id = getCategoryId(category)
    navigate(`/categories/${scope}/edit/${id}`)
  }

  const handleView = (category: Category) => {
    if (!scope) return
    const id = getCategoryId(category)
    navigate(`/categories/${scope}/view/${id}`)
  }

  const handleDelete = async (category: Category) => {
    const ok = await confirm({
      title: 'Delete category?',
      message: `Are you sure you want to delete "${category.name}"?`,
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return

    try {
      const id = getCategoryId(category)
      const response = await CategoriesService.deleteCategory(id)

      if (response.success) {
        dispatch(
          addToast({
            message: 'Category deleted successfully!',
            severity: 'success',
            duration: 4000,
          })
        )
        await loadAll()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      dispatch(
        addToast({
          message: 'Failed to delete category.',
          severity: 'error',
          duration: 4000,
        })
      )
    }
  }

  const getCategoryStatus = (category: Category) => {
    return (category as any).is_active !== undefined
      ? (category as any).is_active
      : (category.isActive ?? category.status === 'active')
  }

  const getCategoryType = (category: Category) => {
    return (category.type || category.categoryType || 'product') as 'product' | 'service' | 'both'
  }

  const categoryColumns: StandardTableColumn<Category>[] = [
    {
      id: 'image',
      label: 'Image',
      width: 80,
      render: (_, cat) => (
        <Avatar className="h-[50px] w-[50px] rounded-md">
          <AvatarImage src={cat.image || (cat as any).icon} alt={cat.name} />
          <AvatarFallback>
            <LayoutGrid className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_, cat) => <span className="font-semibold">{cat.name}</span>,
    },
    {
      id: 'applies',
      label: 'Applies to',
      sortable: true,
      valueGetter: (cat) => getAppliesToLabel(cat).label,
      render: (_, cat) => {
        const t = getCategoryType(cat)
        return (
          <Badge variant="outline" className={cn('max-w-[200px] truncate', appliesBadgeClass(t))}>
            {getAppliesToLabel(cat).label}
          </Badge>
        )
      },
    },
    {
      id: 'description',
      label: 'Description',
      render: (_, cat) => (
        <span className="line-clamp-1 max-w-[300px] text-sm text-muted-foreground">
          {cat.description || 'No description'}
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      valueGetter: (cat) => (getCategoryStatus(cat) ? 'active' : 'inactive'),
      render: (_, cat) => (
        <Badge variant={getCategoryStatus(cat) ? 'success' : 'secondary'}>
          {getCategoryStatus(cat) ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'sortOrder',
      label: 'Sort order',
      sortable: true,
      valueGetter: (cat) => cat.sortOrder ?? (cat as any).sort_order ?? 0,
      render: (_, cat) => <span className="text-sm">{cat.sortOrder ?? (cat as any).sort_order ?? 0}</span>,
    },
  ]

  if (!isValidScope || !scope) {
    return <Navigate to="/categories" replace />
  }

  const title = scope === 'products' ? 'Product categories' : 'Service categories'
  const subtitle =
    scope === 'products'
      ? 'For E‑commerce, inventory, and product assignment. “Both” also appears in service flows.'
      : 'For platform and marketplace services and bookings. “Both” also appears in the product catalog.'
  const otherPath = scope === 'products' ? '/categories/services' : '/categories/products'
  const otherLabel = scope === 'products' ? 'Open service categories' : 'Open product categories'

  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold">{title}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/categories')}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            All catalogs
          </Button>
          <Button variant="outline" onClick={() => navigate(otherPath)}>
            {otherLabel}
          </Button>
          <Button onClick={() => navigate(`/categories/${scope}/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            {scope === 'products' ? 'Add product category' : 'Add service category'}
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-md border border-sky-200 bg-sky-50/80 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40">
        {scope === 'products'
          ? 'You are editing the product catalog. Service-only categories are managed under Service categories.'
          : 'You are editing the service catalog. Product-only categories are managed under Product categories.'}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{searchTerm ? 'Matching' : 'Total'}</p>
              </div>
              <LayoutGrid className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-600">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
              <LayoutGrid className="h-10 w-10 text-amber-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <StandardTable<Category>
        columns={categoryColumns}
        data={paged}
        getRowId={(row) => getCategoryId(row)}
        loading={isLoading}
        emptyMessage="No categories found"
        emptyDescription="Create a category in this list or adjust your search."
        searchPlaceholder="Search in this list…"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchControlled
        showSearch
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filtered.length}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r)
          setPage(0)
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        renderActions={(category) => (
          <div className="flex justify-end gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View"
              onClick={() => handleView(category)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Edit"
              onClick={() => handleEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              title="Delete"
              onClick={() => handleDelete(category)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        size="small"
        minHeight={400}
      />
    </div>
  )
}

export default CategoriesList
