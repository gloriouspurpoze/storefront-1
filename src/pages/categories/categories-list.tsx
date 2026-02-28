import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  Chip,
  Avatar,
  Typography,
  Button,
  Tooltip,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { CategoriesService } from '../../services/api/categories.service'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import type { Category } from '../../types'

export function CategoriesList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  useEffect(() => {
    fetchCategories()
  }, [page, rowsPerPage, searchTerm])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await CategoriesService.getCategories({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      })
      
      if (response.success && response.data) {
        const cats = response.data.categories || []
        setCategories(cats)
        setTotalCount(response.data.pagination?.total || cats.length)
        
        // Calculate stats
        setStats({
          total: cats.length,
          active: cats.filter(c => (c as any).is_active || c.isActive || c.status === 'active').length,
          inactive: cats.filter(c => !(c as any).is_active && !c.isActive && c.status !== 'active').length,
        })
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryId = (category: Category): string => {
    return category.id || (category as any)._id || ''
  }

  const handleEdit = (category: Category) => {
    const id = getCategoryId(category)
    navigate(`/categories/edit/${id}`)
  }

  const handleView = (category: Category) => {
    const id = getCategoryId(category)
    navigate(`/categories/view/${id}`)
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }

    try {
      const id = getCategoryId(category)
      const response = await CategoriesService.deleteCategory(id)
      
      if (response.success) {
        dispatch(addToast({
          message: 'Category deleted successfully!',
          severity: 'success',
          duration: 4000,
        }))
        fetchCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      dispatch(addToast({
        message: 'Failed to delete category.',
        severity: 'error',
        duration: 4000,
      }))
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getCategoryType = (category: Category) => {
    const type = category.type || category.categoryType
    return type || 'product'
  }

  const getCategoryStatus = (category: Category) => {
    return (category as any).is_active !== undefined
      ? (category as any).is_active
      : (category.isActive ?? category.status === 'active')
  }

  const categoryColumns: StandardTableColumn<Category>[] = [
    {
      id: 'image',
      label: 'Image',
      width: 80,
      render: (_, cat) => (
        <Avatar
          src={cat.image || (cat as any).icon}
          alt={cat.name}
          sx={{ width: 50, height: 50 }}
        >
          <CategoryIcon />
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_, cat) => (
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {cat.name}
        </Typography>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      valueGetter: (cat) => getCategoryType(cat),
      render: (_, cat) => (
        <Chip
          label={getCategoryType(cat)}
          size="small"
          color={
            getCategoryType(cat) === 'product'
              ? 'primary'
              : getCategoryType(cat) === 'service'
                ? 'secondary'
                : 'default'
          }
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (_, cat) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cat.description || 'No description'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      valueGetter: (cat) => (getCategoryStatus(cat) ? 'active' : 'inactive'),
      render: (_, cat) => (
        <Chip
          label={getCategoryStatus(cat) ? 'Active' : 'Inactive'}
          size="small"
          color={getCategoryStatus(cat) ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'sortOrder',
      label: 'Sort Order',
      sortable: true,
      valueGetter: (cat) => cat.sortOrder ?? (cat as any).sort_order ?? 0,
      render: (_, cat) => (
        <Typography variant="body2">
          {cat.sortOrder ?? (cat as any).sort_order ?? 0}
        </Typography>
      ),
    },
  ]

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage product and service categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/categories/create')}
        >
          Create Category
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Categories
                </Typography>
              </Box>
              <CategoryIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active
                </Typography>
              </Box>
              <TrendingIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {stats.inactive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inactive
                </Typography>
              </Box>
              <CategoryIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <StandardTable<Category>
        columns={categoryColumns}
        data={categories}
        getRowId={(row) => getCategoryId(row)}
        loading={isLoading}
        emptyMessage="No categories found"
        emptyDescription="Create your first category to get started!"
        searchPlaceholder="Search categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchControlled
        showSearch
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r)
          setPage(0)
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        renderActions={(category) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="View Details">
              <IconButton size="small" color="primary" onClick={() => handleView(category)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Category">
              <IconButton size="small" color="primary" onClick={() => handleEdit(category)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Category">
              <IconButton size="small" color="error" onClick={() => handleDelete(category)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        size="small"
        minHeight={400}
      />
    </Box>
  )
}

export default CategoriesList

