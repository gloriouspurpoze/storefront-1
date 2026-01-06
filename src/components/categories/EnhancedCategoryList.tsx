import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Avatar,
  Badge,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  Mouse as ClickIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'

// Enhanced styling
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}))

const CategoryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}))

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  marginTop: theme.spacing(1),
}))

const FilterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: alpha(theme.palette.background.paper, 0.7),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}))

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

interface ViewMode {
  type: 'grid' | 'list' | 'tree'
  showHierarchy: boolean
}

export default function EnhancedCategoryList({
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryCreate,
  showStats = true,
  allowSelection = false,
  selectedCategories = [],
  onSelectionChange,
}: EnhancedCategoryListProps) {
  const theme = useTheme()
  
  // State management
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service' | 'both'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | '0' | '1' | '2' | '3'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'viewCount' | 'clickCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'grid', showHierarchy: true })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategories)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)

  // Load categories
  const loadCategories = async () => {
    setLoading(true)
    try {
      const query = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        category_type: typeFilter === 'all' ? undefined : typeFilter,
        level: levelFilter === 'all' ? undefined : parseInt(levelFilter),
        sort_by: sortBy,
        sort_order: sortOrder,
      }
      
      const response = await CategoriesService.getCategories(query)
      setCategories(response.data.categories)
      setTotalCount(response.data.pagination.total)
    } catch (err) {
      setError('Failed to load categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter, levelFilter, sortBy, sortOrder])

  // Handle selection
  const handleSelectionChange = (categoryId: string, selected: boolean) => {
    if (!allowSelection) return
    
    const newSelection = selected
      ? [...selectedIds, categoryId]
      : selectedIds.filter(id => id !== categoryId)
    
    setSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }

  // Handle category actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setAnchorEl(event.currentTarget)
    setSelectedCategory(category)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCategory(null)
  }

  const handleEdit = () => {
    if (selectedCategory) {
      onCategoryEdit?.(selectedCategory)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedCategory) {
      onCategoryDelete?.(selectedCategory)
    }
    handleMenuClose()
  }

  const handleView = () => {
    if (selectedCategory) {
      onCategorySelect?.(selectedCategory)
    }
    handleMenuClose()
  }

  // Toggle category expansion
  const toggleExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Filter categories based on current filters
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesSearch = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'inactive' && !category.isActive)
      
      const matchesType = typeFilter === 'all' || category.type === typeFilter
      const matchesLevel = levelFilter === 'all' || category.level.toString() === levelFilter
      
      return matchesSearch && matchesStatus && matchesType && matchesLevel
    })
  }, [categories, searchTerm, statusFilter, typeFilter, levelFilter])

  // Render category card
  const renderCategoryCard = (category: Category) => (
    <StyledCard key={category.id} sx={{ height: '100%' }}>
      <CardContent>
        <CategoryHeader>
          <Avatar
            sx={{
              bgcolor: category.colorCode || theme.palette.primary.main,
              width: 48,
              height: 48,
            }}
          >
            <CategoryIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="div" noWrap>
              {category.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {category.description}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, category)}
          >
            <MoreVertIcon />
          </IconButton>
        </CategoryHeader>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={category.type}
            size="small"
            color={category.type === 'service' ? 'primary' : category.type === 'product' ? 'secondary' : 'default'}
          />
          <Chip
            label={`Level ${category.level}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={category.isActive ? 'Active' : 'Inactive'}
            size="small"
            color={category.isActive ? 'success' : 'error'}
          />
        </Box>

        {showStats && (
          <StatsContainer>
            <Tooltip title="Views">
              <Chip
                icon={<VisibilityIcon />}
                label={category.viewCount}
                size="small"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="Clicks">
              <Chip
                icon={<ClickIcon />}
                label={category.clickCount}
                size="small"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="Children">
              <Chip
                icon={<CategoryIcon />}
                label={category.childrenCount}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </StatsContainer>
        )}

        {category.breadcrumbs && category.breadcrumbs.length > 1 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Path: {category.breadcrumbs.join(' > ')}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => onCategorySelect?.(category)}
        >
          View
        </Button>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onCategoryEdit?.(category)}
        >
          Edit
        </Button>
      </CardActions>
    </StyledCard>
  )

  // Render loading skeleton
  const renderSkeleton = () => (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box flex={1}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>
            <Skeleton variant="rectangular" height={32} />
          </CardContent>
        </Card>
      ))}
    </Box>
  )

  return (
    <Box>
      {/* Filters */}
      <FilterContainer>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <Box flex="1" minWidth="200px">
            <TextField
              fullWidth
              size="small"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          
          <Box minWidth="150px">
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box minWidth="150px">
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box minWidth="150px">
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                label="Level"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="0">Root</MenuItem>
                <MenuItem value="1">Level 1</MenuItem>
                <MenuItem value="2">Level 2</MenuItem>
                <MenuItem value="3">Level 3</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box minWidth="150px">
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="created_at">Created Date</MenuItem>
                <MenuItem value="viewCount">Views</MenuItem>
                <MenuItem value="clickCount">Clicks</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box minWidth="100px">
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Box>
        </Box>
      </FilterContainer>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
          {filteredCategories.map((category) => (
            <Box key={category.id}>
              {renderCategoryCard(category)}
            </Box>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Category</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Category</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}
