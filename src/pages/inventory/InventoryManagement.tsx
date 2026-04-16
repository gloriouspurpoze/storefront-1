import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  Inventory2 as InventoryIcon,
  WarningAmber as LowStockIcon,
  RemoveShoppingCart as OutIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { ProductsService } from '../../services/api/products.service'
import type { Product } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

type StockFilter = 'all' | 'in_stock' | 'low' | 'out'

function stockStatus(product: Product): 'out' | 'low' | 'ok' {
  const qty = Number(product.stock_quantity) || 0
  const low = product.low_stock_threshold != null ? Number(product.low_stock_threshold) : 5
  if (qty <= 0) return 'out'
  if (qty <= low) return 'low'
  return 'ok'
}

/**
 * Operations-style inventory: on-hand quantities, low-stock thresholds, quick adjustments.
 * Aligns with common commerce admin patterns (Shopify / BigCommerce–style stock list).
 */
export default function InventoryManagement() {
  const theme = useTheme()
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

  const statusChip = (p: Product) => {
    const s = stockStatus(p)
    if (s === 'out')
      return <Chip size="small" icon={<OutIcon />} label="Out of stock" color="error" variant="outlined" />
    if (s === 'low')
      return <Chip size="small" icon={<LowStockIcon />} label="Low stock" color="warning" variant="outlined" />
    return <Chip size="small" label="In stock" color="success" variant="outlined" />
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Inventory"
        subtitle="On-hand quantities, low-stock alerts, and quick adjustments — without opening the full product editor."
        icon={<InventoryIcon color="primary" sx={{ fontSize: 40 }} />}
        action={
          <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/products/add">
            Add product
          </Button>
        }
      />

      <Alert severity="info" sx={{ mt: 2, mb: 2, maxWidth: 960 }}>
        <strong>How teams use this:</strong> filter by low or out-of-stock, adjust on-hand counts after receiving goods or cycle counts, and set
        reorder alerts via the low-stock threshold. Full merchandising (price, images) stays under <strong>Products</strong>.
      </Alert>

      {!canAdjust && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have view-only access. Ask an admin for <strong>edit products</strong> or <strong>manage product inventory</strong> to change
          quantities.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: filter === 'all' ? 'SKUs (this page)' : 'SKUs (filtered)', value: kpis.skus, color: theme.palette.primary.main },
          { label: 'Units on hand', value: kpis.units.toLocaleString(), color: theme.palette.info.main },
          { label: 'Low stock', value: kpis.low, color: theme.palette.warning.main },
          { label: 'Out of stock', value: kpis.out, color: theme.palette.error.main },
        ].map((k) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {k.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: k.color, mt: 0.5 }}>
                {loading ? '—' : k.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.9)}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search SKU or product name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(searchInput)
                setPage(0)
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setAppliedSearch(searchInput)
              setPage(0)
            }}
          >
            Search
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Stock status
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="in_stock">Healthy</ToggleButton>
            <ToggleButton value="low">Low</ToggleButton>
            <ToggleButton value="out">Out</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">On hand</TableCell>
                <TableCell align="right">Low at</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton variant="rounded" height={36} />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredByStatus.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{p.name}</Typography>
                        {p.category?.name && (
                          <Typography variant="caption" color="text.secondary">
                            {p.category.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {p.sku || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {Number(p.stock_quantity) || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{p.low_stock_threshold ?? 5}</TableCell>
                      <TableCell>{statusChip(p)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Full product edit">
                          <IconButton size="small" onClick={() => navigate(`/products/edit/${p.id}`)} aria-label="Edit product">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canAdjust && (
                          <Button size="small" onClick={() => openAdjust(p)}>
                            Adjust
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filteredByStatus.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No rows match this filter. Try another status or search.</Typography>
          </Box>
        )}
        {filter !== 'all' && !loading && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Status filters apply to the <strong>current page</strong> of results. Increase &quot;rows per page&quot; or refine search to cover more
            SKUs.
          </Alert>
        )}
        {filter === 'all' ? (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        ) : (
          <Box sx={{ py: 1.5, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredByStatus.length} row(s) after status filter on this page (pagination applies when &quot;All&quot; is selected).
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={adjustOpen} onClose={() => !saving && setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogContent>
          {activeProduct && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeProduct.name}
              </Typography>
              <TextField
                fullWidth
                margin="dense"
                label="Quantity on hand"
                type="number"
                inputProps={{ min: 0 }}
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Low-stock alert threshold"
                type="number"
                inputProps={{ min: 0 }}
                helperText="Alert when on-hand quantity is at or below this number."
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveAdjust()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
