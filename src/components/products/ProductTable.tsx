import React, { useState } from 'react'
import {
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Plus,
} from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Product } from '../../types'
import { formatCurrency, cn } from '../../lib/utils'
import { getPrimaryProductImageUrl } from '../../lib/productImages'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Pagination } from '../common/Pagination'

interface ProductTableProps {
  products: Product[]
  onUpdate: (product: Product) => void
  onDelete: (productId: number | string) => void
  onAdd: () => void
  onView: (product: Product) => void
  categories: Array<{ id: number | string; name: string }>
}

function stockVariant(q: number): React.ComponentProps<typeof Badge>['variant'] {
  if (q > 10) return 'success'
  if (q > 0) return 'warning'
  return 'destructive'
}

export function ProductTable({ products, onUpdate, onDelete, onAdd, onView, categories }: ProductTableProps) {
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedProducts, setSelectedProducts] = useState<(number | string)[]>([])
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const isMobile = useMediaQuery('(max-width: 639px)')

  const formatProductUpdated = (product: Product) => {
    const raw = product.updated_at || product.updatedAt
    if (!raw) return '—'
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  const truncateText = (text: string, max: number) => {
    if (!text) return '—'
    const t = text.replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    return `${t.slice(0, max)}…`
  }

  const q = searchTerm.toLowerCase()
  const filteredProducts = products.filter((product) => {
    const short = (product.short_description || '').toLowerCase()
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      (product.sku && product.sku.toLowerCase().includes(q)) ||
      short.includes(q) ||
      (product.description && product.description.toLowerCase().includes(q))
    const matchesCategory =
      categoryFilter === 'all' || product.category_id?.toString() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.max(1, Math.ceil(Math.max(0, filteredProducts.length) / rowsPerPage))
  const pageClamped = Math.min(page, totalPages - 1)
  const paginatedProducts = filteredProducts.slice(
    pageClamped * rowsPerPage,
    pageClamped * rowsPerPage + rowsPerPage,
  )

  const handleEdit = (product: Product) => {
    navigate(`/products/edit/${product.id}`)
  }

  const handleView = (product: Product) => {
    navigate(`/products/view/${product.id}`)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      onDelete(productToDelete.id)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      setToast({ open: true, message: 'Product deleted successfully' })
      window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 4000)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: number | string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleBulkDelete = () => {
    selectedProducts.forEach((id) => onDelete(id))
    setSelectedProducts([])
    setToast({ open: true, message: `${selectedProducts.length} products deleted successfully` })
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 4000)
  }

  const getCategoryName = (categoryId: number | string) => {
    const category = categories.find((c) => c.id?.toString() === categoryId?.toString())
    return category ? category.name : 'Unknown'
  }

  const allSelected = paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length
  const someSelected = selectedProducts.length > 0 && !allSelected

  const ProductCard = ({ product }: { product: Product }) => {
    const stock = product.stock_quantity || 0
    return (
      <Card className="relative mb-2">
        <CardContent className="p-4">
          <Checkbox
            className="absolute right-2 top-2"
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => handleSelectProduct(product.id)}
            aria-label="Select product"
          />
          <div className="flex gap-2 pr-8">
            <img
              src={getPrimaryProductImageUrl(product.images) ?? 'https://via.placeholder.com/80'}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-base font-semibold">{product.name}</p>
              {product.short_description && (
                <p className="mb-0.5 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
              )}
              <p className="mb-1 text-sm text-muted-foreground">SKU: {product.sku}</p>
              <div className="mb-1 flex items-center gap-1 text-sm">
                <span className="text-bloom-coral">★</span>
                <span>{(product.rating || 0).toFixed(1)}</span>
                <span className="text-muted-foreground">({product.review_count || 0})</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                <Badge variant="outline">{getCategoryName(product.category_id || '')}</Badge>
                <Badge variant={stockVariant(stock)}>{stock}</Badge>
                <Badge variant={product.is_featured || product.isFeatured ? 'default' : 'secondary'}>
                  {product.is_featured || product.isFeatured ? 'Featured' : 'Regular'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
                  {product.original_price && product.original_price > product.price && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatCurrency(product.original_price)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" title="View" onClick={() => handleView(product)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    title="Delete"
                    onClick={() => handleDeleteClick(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ProductRow = ({ product }: { product: Product }) => {
    const stock = product.stock_quantity || 0
    return (
      <TableRow>
        <TableCell className="w-10">
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => handleSelectProduct(product.id)}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12 rounded-md">
              {getPrimaryProductImageUrl(product.images) ? (
                <AvatarImage
                  src={getPrimaryProductImageUrl(product.images)!}
                  alt={product.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-md">{product.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold">{product.name}</p>
              <p className="line-clamp-2 max-w-[360px] text-sm text-muted-foreground">
                {product.short_description ? truncateText(product.short_description, 120) : '—'}
              </p>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{getCategoryName(product.category_id || '')}</Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{formatProductUpdated(product)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-bloom-coral">★</span>
            {(product.rating || 0).toFixed(1)} ({product.review_count || 0})
          </div>
        </TableCell>
        <TableCell>
          <span className="font-semibold">{formatCurrency(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.original_price)}</p>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={stockVariant(stock)}>{stock}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            <Badge variant={product.is_featured || product.isFeatured ? 'default' : 'secondary'}>
              {product.is_featured || product.isFeatured ? 'Featured' : 'Regular'}
            </Badge>
            <Badge variant={product.is_active !== false ? 'success' : 'secondary'}>
              {product.is_active !== undefined ? (product.is_active ? 'Active' : 'Inactive') : 'Active'}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" title="View" onClick={() => onView(product)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(product)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              title="Delete"
              onClick={() => handleDeleteClick(product)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Products Management</h2>
        <Button type="button" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, SKU, or short description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={String(category.id)} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="gap-2" disabled>
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
          {selectedProducts.length > 0 && (
            <Button type="button" variant="destructive" onClick={handleBulkDelete}>
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
        </div>
      </Card>

      {isMobile ? (
        <div>
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {paginatedProducts.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No products found</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(c) => handleSelectAll(c === true)}
                    aria-label="Select all on page"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <Pagination
          currentPage={pageClamped + 1}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p - 1)}
          onItemsPerPageChange={(n) => {
            setRowsPerPage(n)
            setPage(0)
          }}
          itemsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast.open && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-md border bg-background px-4 py-3 text-sm shadow-lg',
          )}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
