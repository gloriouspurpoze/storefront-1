import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, HStack } from '../ui'
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { Eye, Pencil, Trash2, Package } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
  categories: Array<{ id: number | string; name: string }>
  onDelete: (productId: number | string) => void
  onView: (product: Product) => void
  onAdd: () => void
}

function categoryName(categories: ProductGridProps['categories'], categoryId?: number | string) {
  if (categoryId == null) return '—'
  const c = categories.find((x) => String(x.id) === String(categoryId))
  return c?.name ?? '—'
}

function productUpdatedLabel(product: Product) {
  const raw = product.updated_at || product.updatedAt
  if (!raw) return null
  try {
    return new Date(raw).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

export function ProductGrid({
  products,
  categories,
  onDelete,
  onView,
  onAdd,
}: ProductGridProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>Add product</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const updated = productUpdatedLabel(product)
          const img =
            Array.isArray(product.images) && product.images.length > 0
              ? typeof product.images[0] === 'string'
                ? product.images[0]
                : (product.images[0] as { url?: string })?.url
              : null
          return (
            <Card key={String(product.id)} className="overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-muted relative">
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-12 w-12 opacity-40" />
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${
                    product.is_active ? 'bg-storm-mist/30 text-storm-deep' : 'bg-bloom-rose text-bloom-coral'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Draft'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                {product.short_description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  SKU: {product.sku || '—'} · {categoryName(categories, product.category_id)}
                </p>
                <p className="text-lg font-bold mt-2">{formatCurrency(Number(product.price || 0))}</p>
                <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity ?? 0}</p>
                {updated && (
                  <p className="text-xs text-muted-foreground mt-0.5">Updated {updated}</p>
                )}
                <HStack spacing={2} className="mt-auto pt-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => onView(product)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </HStack>
              </div>
            </Card>
          )
        })}
      </div>
      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No products match your filters.</div>
      )}
    </div>
  )
}
