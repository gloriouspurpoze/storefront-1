import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { Search, Package, AlertTriangle, ShoppingCart, Pencil, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { ProductsService } from '../../services/api/products.service'
import type { Product } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { cn } from '../../lib/utils'

type StockFilter = 'all' | 'in_stock' | 'low' | 'out'

function stockStatus(product: Product): 'out' | 'low' | 'ok' {
  const qty = Number(product.stock_quantity) || 0
  const low = product.low_stock_threshold != null ? Number(product.low_stock_threshold) : 5
  if (qty <= 0) return 'out'
  if (qty <= low) return 'low'
  return 'ok'
}

export default function InventoryManagement() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { checkPermission } = usePermissions()

  const canAdjust = checkPermission('edit_products') || checkPermission('manage_product_inventory')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filter, setFilter] = useState<StockFilter>('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [total, setTotal] = useState(0)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [qtyDraft, setQtyDraft] = useState('')
  const [thresholdDraft, setThresholdDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ProductsService.getProducts({
        page: page + 1,
        limit: rowsPerPage,
        search: appliedSearch.trim() || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      })
      if (res.success && res.data) {
        setProducts(res.data.products || [])
        setTotal(res.data.pagination?.total ?? res.data.products?.length ?? 0)
      } else {
        setProducts([])
        setTotal(0)
      }
    } catch {
      dispatch(
        addToast({
          message: 'Could not load inventory.',
          severity: 'error',
          duration: 4000,
        }),
      )
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, appliedSearch, dispatch])

  useEffect(() => {
    load()
  }, [load])

  const filteredByStatus = useMemo(() => {
    return products.filter((p) => {
      const s = stockStatus(p)
      if (filter === 'all') return true
      if (filter === 'out') return s === 'out'
      if (filter === 'low') return s === 'low'
      if (filter === 'in_stock') return s === 'ok'
      return true
    })
  }, [products, filter])

  const kpis = useMemo(() => {
    const list = filteredByStatus
    let units = 0
    let low = 0
    let out = 0
    for (const p of list) {
      units += Number(p.stock_quantity) || 0
      const s = stockStatus(p)
      if (s === 'low') low += 1
      if (s === 'out') out += 1
    }
    return {
      skus: list.length,
      units,
      low,
      out,
    }
  }, [filteredByStatus])

  const openAdjust = (p: Product) => {
    setActiveProduct(p)
    setQtyDraft(String(p.stock_quantity ?? 0))
    setThresholdDraft(String(p.low_stock_threshold ?? 5))
    setAdjustOpen(true)
  }

  const saveAdjust = async () => {
    if (!activeProduct || !canAdjust) return
    const q = parseInt(qtyDraft, 10)
    const t = parseInt(thresholdDraft, 10)
    if (Number.isNaN(q) || q < 0) {
      dispatch(addToast({ message: 'Enter a valid quantity (0 or more).', severity: 'warning', duration: 3000 }))
      return
    }
    if (Number.isNaN(t) || t < 0) {
      dispatch(addToast({ message: 'Enter a valid low-stock threshold (0 or more).', severity: 'warning', duration: 3000 }))
      return
    }
    setSaving(true)
    try {
      const res = await ProductsService.updateProduct(String(activeProduct.id), {
        stock_quantity: q,
        low_stock_threshold: t,
      })
      if (res.success) {
        dispatch(addToast({ message: 'Stock levels updated.', severity: 'success', duration: 3000 }))
        setAdjustOpen(false)
        await load()
      }
    } catch {
      dispatch(addToast({ message: 'Update failed.', severity: 'error', duration: 4000 }))
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (p: Product) => {
    const s = stockStatus(p)
    if (s === 'out')
      return (
        <Badge variant="outline" className="gap-1 border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/40">
          <ShoppingCart className="h-3 w-3" />
          Out of stock
        </Badge>
      )
    if (s === 'low')
      return (
        <Badge variant="outline" className="gap-1 border-bloom-coral/40 bg-bloom-rose text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/40">
          <AlertTriangle className="h-3 w-3" />
          Low stock
        </Badge>
      )
    return <Badge variant="outline" className="border-storm-mist/30 bg-storm-mist/30 text-storm-deep dark:border-storm-deep">In stock</Badge>
  }

  const rangeStart = total === 0 ? 0 : page * rowsPerPage + 1
  const rangeEnd = Math.min((page + 1) * rowsPerPage, total)

  const kpiCards = [
    { label: filter === 'all' ? 'SKUs (this page)' : 'SKUs (filtered)', value: kpis.skus, className: 'text-primary' },
    { label: 'Units on hand', value: kpis.units.toLocaleString(), className: 'text-primary' },
    { label: 'Low stock', value: kpis.low, className: 'text-bloom-coral' },
    { label: 'Out of stock', value: kpis.out, className: 'text-destructive' },
  ]

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Inventory"
          subtitle="On-hand quantities, low-stock alerts, and quick adjustments — without opening the full product editor."
          icon={<Package className="h-10 w-10 text-primary" />}
          action={
            <Button asChild>
              <RouterLink to="/products/add">
                <Plus className="mr-2 h-4 w-4" />
                Add product
              </RouterLink>
            </Button>
          }
        />

        <div className="mt-4 mb-4 max-w-3xl rounded-lg border border-primary/20 bg-primary-soft/80 px-3 py-2 text-sm text-primary dark:border-primary dark:bg-primary/30 dark:text-primary-deep">
          <strong>How teams use this:</strong> filter by low or out-of-stock, adjust on-hand counts after receiving goods or cycle counts, and set
          reorder alerts via the low-stock threshold. Full merchandising (price, images) stays under <strong>Products</strong>.
        </div>

        {!canAdjust && (
          <div className="mb-4 rounded-lg border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/30">
            You have view-only access. Ask an admin for <strong>edit products</strong> or <strong>manage product inventory</strong> to change
            quantities.
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpiCards.map((k) => (
            <Card key={k.label} className="rounded-xl border shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className={cn('mt-1 text-2xl font-bold tabular-nums', k.className)}>{loading ? '—' : k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-xl border p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search SKU or product name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedSearch(searchInput)
                    setPage(0)
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAppliedSearch(searchInput)
                setPage(0)
              }}
            >
              Search
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Stock status</span>
              <div className="flex rounded-lg border p-0.5">
                {(
                  [
                    ['all', 'All'],
                    ['in_stock', 'Healthy'],
                    ['low', 'Low'],
                    ['out', 'Out'],
                  ] as const
                ).map(([val, label]) => (
                  <Button
                    key={val}
                    type="button"
                    size="sm"
                    variant={filter === val ? 'secondary' : 'ghost'}
                    className="h-8 px-2 text-xs"
                    onClick={() => setFilter(val)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Low at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <div className="h-9 animate-pulse rounded-md bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))
                  : filteredByStatus.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <p className="font-semibold">{p.name}</p>
                          {p.category?.name && <p className="text-xs text-muted-foreground">{p.category.name}</p>}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{p.sku || '—'}</span>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">{Number(p.stock_quantity) || 0}</TableCell>
                        <TableCell className="text-right">{p.low_stock_threshold ?? 5}</TableCell>
                        <TableCell>{statusBadge(p)}</TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/products/edit/${p.id}`)} aria-label="Edit product">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Full product edit</TooltipContent>
                          </Tooltip>
                          {canAdjust && (
                            <Button type="button" variant="outline" size="sm" className="ml-1" onClick={() => openAdjust(p)}>
                              Adjust
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredByStatus.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No rows match this filter. Try another status or search.</div>
          )}

          {filter !== 'all' && !loading && (
            <div className="mt-3 rounded-lg border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/30">
              Status filters apply to the <strong>current page</strong> of results. Increase &quot;rows per page&quot; or refine search to cover more
              SKUs.
            </div>
          )}

          {filter === 'all' ? (
            <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(v) => {
                    setRowsPerPage(Number(v))
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="hidden sm:inline">
                  {total === 0 ? '0–0' : `${rangeStart}–${rangeEnd}`} of {total}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * rowsPerPage >= total || total === 0}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 px-1 text-xs text-muted-foreground">
              Showing {filteredByStatus.length} row(s) after status filter on this page (pagination applies when &quot;All&quot; is selected).
            </p>
          )}
        </Card>

        <Dialog open={adjustOpen} onOpenChange={(o) => !o && !saving && setAdjustOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust stock</DialogTitle>
            </DialogHeader>
            {activeProduct && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">{activeProduct.name}</p>
                <div className="space-y-2">
                  <Label htmlFor="qty-hand">Quantity on hand</Label>
                  <Input
                    id="qty-hand"
                    type="number"
                    min={0}
                    value={qtyDraft}
                    onChange={(e) => setQtyDraft(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty-threshold">Low-stock alert threshold</Label>
                  <Input
                    id="qty-threshold"
                    type="number"
                    min={0}
                    value={thresholdDraft}
                    onChange={(e) => setThresholdDraft(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Alert when on-hand quantity is at or below this number.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveAdjust()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
