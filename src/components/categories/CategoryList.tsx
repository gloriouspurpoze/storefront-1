import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Paper,
  Fade,
  Slide,
  Collapse,
  Tooltip,
  Badge,
  Alert,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Folder as FolderIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category, CategoryWithStats } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import CategoryCard from './CategoryCard'
import CategoryForm from './CategoryForm'

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Enhanced styling
const ListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  minHeight: '100vh',
}))

const HeaderSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}))

const FilterSection = styled(Collapse)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiCollapse-wrapper': {
    padding: theme.spacing(2),
    backgroundColor: alpha(theme.palette.grey[50], 0.5),
    borderRadius: theme.spacing(2),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
}))

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}))

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  height: 200,
}))

export interface CategoryListProps {
  onCategorySelect?: (category: Category) => void
  showStats?: boolean
  allowSelection?: boolean
  selectedCategories?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

type ViewMode = 'grid' | 'list'
type SortBy = 'name' | 'createdAt' | 'productCount' | 'status'
type SortOrder = 'asc' | 'desc'

export const CategoryList: React.FC<CategoryListProps> = ({
  onCategorySelect,
  showStats = true,
  allowSelection = false,
  selectedCategories = [],
  onSelectionChange,
}) => {
  const theme = useTheme()
  
  // State management
  const [categories, setCategories] = useState<CategoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [parentFilter, setParentFilter] = useState<'all' | 'top-level' | 'subcategories'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service' | 'both'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategories)
  
  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [parentCategories, setParentCategories] = useState<Category[]>([])

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setSearchTerm(term)
    }, 300),
    []
  )

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await CategoriesService.getCategoriesWithStats()
      setCategories(response.data)
      
      // Load parent categories for the form
      const parentsResponse = await CategoriesService.getCategories({ limit: 100 })
      setParentCategories(parentsResponse.data.categories.filter(c => !c.parentId))
      
    } catch (err) {
      setError('Failed to load categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (isMounted) {
        await loadCategories()
      }
    }
    
    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Handle selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds, onSelectionChange])

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    let filtered = categories

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category => category.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(category => 
        (category as any).categoryType === typeFilter || (category as any).categoryType === 'both'
      )
    }

    // Parent filter
    if (parentFilter === 'top-level') {
      filtered = filtered.filter(category => !category.parentId)
    } else if (parentFilter === 'subcategories') {
      filtered = filtered.filter(category => category.parentId)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'productCount') {
        aValue = a.productCount || 0
        bValue = b.productCount || 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [categories, searchTerm, statusFilter, typeFilter, parentFilter, sortBy, sortOrder])

  // Category statistics
  const stats = useMemo(() => {
    const total = categories.length
    const active = categories.filter(c => c.status === 'active').length
    const inactive = categories.filter(c => c.status === 'inactive').length
    const topLevel = categories.filter(c => !c.parentId).length
    const withProducts = categories.filter(c => (c.productCount || 0) > 0).length

    return { total, active, inactive, topLevel, withProducts }
  }, [categories])

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value)
  }

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleCategoryDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await CategoriesService.deleteCategory(category.id)
        await loadCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  const handleCategoryView = (category: Category) => {
    onCategorySelect?.(category)
  }

  const handleToggleExpand = (category: Category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category.id)) {
        newSet.delete(category.id)
      } else {
        newSet.add(category.id)
      }
      return newSet
    })
  }

  const handleSelectionToggle = (categoryId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleFormSubmit = async (categoryData: any) => {
    try {
      if (editingCategory) {
        await CategoriesService.updateCategory(editingCategory.id, categoryData)
      } else {
        await CategoriesService.createCategory(categoryData)
      }
      await loadCategories()
      setFormOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setParentFilter('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const renderStatsCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <StatsCard>
          <Typography variant="h4" color="primary" fontWeight={600}>
            {stats.total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Categories
          </Typography>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <StatsCard>
          <Typography variant="h4" color="success.main" fontWeight={600}>
            {stats.active}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active
          </Typography>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <StatsCard>
          <Typography variant="h4" color="error.main" fontWeight={600}>
            {stats.inactive}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inactive
          </Typography>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <StatsCard>
          <Typography variant="h4" color="info.main" fontWeight={600}>
            {stats.topLevel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Top Level
          </Typography>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <StatsCard>
          <Typography variant="h4" color="warning.main" fontWeight={600}>
            {stats.withProducts}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            With Products
          </Typography>
        </StatsCard>
      </Grid>
    </Grid>
  )

  const renderFilters = () => (
    <FilterSection in={showFilters}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Category Type</InputLabel>
            <Select
              value={typeFilter}
              label="Category Type"
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="product">📦 Products Only</MenuItem>
              <MenuItem value="service">🔧 Services Only</MenuItem>
              <MenuItem value="both">🔄 Both</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Hierarchy</InputLabel>
            <Select
              value={parentFilter}
              label="Hierarchy"
              onChange={(e) => setParentFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="top-level">Top Level</MenuItem>
              <MenuItem value="subcategories">Subcategories</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="productCount">Product Count</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          </Box>
        </Grid>
      </Grid>
    </FilterSection>
  )

  const renderLoadingSkeletons = () => (
    <Grid container spacing={3}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <LoadingSkeleton variant="rectangular" />
        </Grid>
      ))}
    </Grid>
  )

  const renderCategories = () => (
    <Grid container spacing={3}>
      {filteredCategories.map((category) => (
        <Grid 
          size={{ 
            xs: 12, 
            sm: 6, 
            md: viewMode === 'list' ? 12 : 4 
          }} 
          key={category.id}
        >
          <Fade in timeout={300}>
            <Box>
              {allowSelection && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedIds.includes(category.id)}
                      onChange={() => handleSelectionToggle(category.id)}
                    />
                  }
                  label=""
                  sx={{ mb: 1 }}
                />
              )}
              
              <CategoryCard
                category={category}
                onEdit={handleCategoryEdit}
                onDelete={handleCategoryDelete}
                onView={handleCategoryView}
                onToggleExpand={() => handleToggleExpand(category)}
                isExpanded={expandedCategories.has(category.id)}
                variant={viewMode === 'list' ? 'compact' : 'default'}
                showStats={true}
                showActions={true}
              />
            </Box>
          </Fade>
        </Grid>
      ))}
    </Grid>
  )

  return (
    <ListContainer>
      <HeaderSection elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
              Category Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Organize your product categories and manage their hierarchy
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Category
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
            size="small"
          />
          
          <Tooltip title="Toggle Filters">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton onClick={loadCategories} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Grid View">
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                size="small"
              >
                <GridIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="List View">
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
                size="small"
              >
                <ListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </HeaderSection>

      {showStats && renderStatsCards()}
      
      {renderFilters()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        renderLoadingSkeletons()
      ) : filteredCategories.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No categories found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || parentFilter !== 'all'
              ? 'Try adjusting your search criteria or filters'
              : 'Get started by creating your first category'
            }
          </Typography>
        </Paper>
      ) : (
        renderCategories()
      )}

      <CategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        parentCategories={parentCategories}
        mode={editingCategory ? 'edit' : 'create'}
      />
    </ListContainer>
  )
}

export default CategoryList
