import React, { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Rating,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
  Checkbox,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Divider,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

interface ProductTableProps {
  products: Product[]
  onUpdate: (product: Product) => void
  onDelete: (productId: number | string) => void
  onAdd: () => void
  onView: (product: Product) => void
  categories: Array<{ id: number | string; name: string }>
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' })
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || 
                           product.category_id?.toString() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
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
      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' })
    }
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: number | string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleBulkDelete = () => {
    selectedProducts.forEach(id => onDelete(id))
    setSelectedProducts([])
    setSnackbar({ open: true, message: `${selectedProducts.length} products deleted successfully`, severity: 'success' })
  }

  const getCategoryName = (categoryId: number | string) => {
    const category = categories.find(c => c.id?.toString() === categoryId?.toString())
    return category ? category.name : 'Unknown'
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onChange={() => handleSelectProduct(product.id)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          />
          <CardMedia
            component="img"
            sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
            image={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/80'}
            alt={product.name}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              SKU: {product.sku}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={product.rating || 0} readOnly size="small" precision={0.1} />
              <Typography variant="body2" color="text.secondary">
                ({product.review_count || 0})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={getCategoryName(product.category_id || '')}
                size="small"
                variant="outlined"
              />
              <Chip
                label={product.stock_quantity || 0}
                size="small"
                color={(product.stock_quantity || 0) > 10 ? 'success' : (product.stock_quantity || 0) > 0 ? 'warning' : 'error'}
              />
              <Chip
                label={product.is_featured || product.isFeatured ? 'Featured' : 'Regular'}
                size="small"
                color={product.is_featured || product.isFeatured ? 'primary' : 'default'}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(product.price)}
                </Typography>
                {product.original_price && product.original_price > product.price && (
                  <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    {formatCurrency(product.original_price)}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="View Details">
                  <IconButton size="small" color="primary" onClick={() => handleView(product)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Product">
                  <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Product">
                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(product)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const ProductRow = ({ product }: { product: Product }) => (
    <TableRow hover>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selectedProducts.includes(product.id)}
          onChange={() => handleSelectProduct(product.id)}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={product.images && product.images.length > 0 ? product.images[0] : undefined}
            alt={product.name}
            sx={{ width: 48, height: 48 }}
            variant="rounded"
          >
            {!product.images || product.images.length === 0 ? product.name.charAt(0) : null}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={getCategoryName(product.category_id || '')}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={product.rating || 0} readOnly size="small" precision={0.1} />
          <Typography variant="body2" color="text.secondary">
            ({product.review_count || 0})
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {formatCurrency(product.price)}
        </Typography>
        {product.original_price && product.original_price > product.price && (
          <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
            {formatCurrency(product.original_price)}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={product.stock_quantity || 0}
          size="small"
          color={(product.stock_quantity || 0) > 10 ? 'success' : (product.stock_quantity || 0) > 0 ? 'warning' : 'error'}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={product.is_featured || product.isFeatured ? 'Featured' : 'Regular'}
            size="small"
            color={product.is_featured || product.isFeatured ? 'primary' : 'default'}
          />
          <Chip
            label={product.is_active !== undefined ? (product.is_active ? 'Active' : 'Inactive') : 'Active'}
            size="small"
            color={product.is_active !== false ? 'success' : 'default'}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => onView(product)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Product">
            <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(product)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  )

  const DeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Delete Product</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <Box>
      {/* Header and Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Products Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Add Product
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 300 }, 
              flex: { xs: 'none', sm: 1 } 
            }}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            More Filters
          </Button>
          {selectedProducts.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
        </Box>
      </Paper>

      {/* Content - Table or Cards based on screen size */}
      {isMobile ? (
        <Box>
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {paginatedProducts.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No products found
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedProducts.length > 0 && selectedProducts.length < paginatedProducts.length}
                    checked={paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredProducts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
      />

      {/* Dialogs */}
      <DeleteDialog />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
