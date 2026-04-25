import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Home as HomeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Palette as PaletteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import EnhancedCategoryList from '../../components/categories/EnhancedCategoryList'
import EnhancedCategoryForm from '../../components/categories/EnhancedCategoryForm'
import { useNavigate } from 'react-router-dom'

// Enhanced styling
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}))

const HeaderCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
}))

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}))

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
}))

interface CategoryStats {
  totalCategories: number
  activeCategories: number
  inactiveCategories: number
  serviceCategories: number
  productCategories: number
  bothCategories: number
  rootCategories: number
  subcategories: number
  totalViews: number
  totalClicks: number
}

export default function EnhancedCategoryManagement() {
  const theme = useTheme()
  const navigate = useNavigate()
  
  // State management
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    serviceCategories: 0,
    productCategories: 0,
    bothCategories: 0,
    rootCategories: 0,
    subcategories: 0,
    totalViews: 0,
    totalClicks: 0,
  })
  
  // UI states
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  })

  // Load categories and stats
  const loadData = async () => {
    setLoading(true)
    try {
      // Load all categories for stats
      const response = await CategoriesService.getCategories({ limit: 100 })
      const allCategories = response.data.categories
      setCategories(allCategories)
      
      // Calculate stats
      const newStats: CategoryStats = {
        totalCategories: allCategories.length,
        activeCategories: allCategories.filter(c => c.isActive).length,
        inactiveCategories: allCategories.filter(c => !c.isActive).length,
        serviceCategories: allCategories.filter(c => c.type === 'service').length,
        productCategories: allCategories.filter(c => c.type === 'product').length,
        bothCategories: allCategories.filter(c => c.type === 'both').length,
        rootCategories: allCategories.filter(c => c.level === 0).length,
        subcategories: allCategories.filter(c => c.level > 0).length,
        totalViews: allCategories.reduce((sum, c) => sum + c.viewCount, 0),
        totalClicks: allCategories.reduce((sum, c) => sum + c.clickCount, 0),
      }
      setStats(newStats)
    } catch (error) {
      console.error('Error loading categories:', error)
      setSnackbar({
        open: true,
        message: 'Failed to load categories',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle category actions
  const handleCreateCategory = () => {
    navigate('/categories')
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category)
  }

  const handleCategoryFormClose = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const handleCategoryFormSuccess = (category: Category) => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    loadData() // Reload data
    setSnackbar({
      open: true,
      message: editingCategory ? 'Category updated successfully' : 'Category created successfully',
      severity: 'success'
    })
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    
    try {
      await CategoriesService.deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      loadData() // Reload data
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      setSnackbar({
        open: true,
        message: 'Failed to delete category',
        severity: 'error'
      })
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Render stats cards
  const renderStatsCard = (title: string, value: number, icon: React.ReactNode, color: string) => (
    <StatsCard>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </StatsCard>
  )

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      {/* Header */}
      <HeaderCard>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                <Link color="inherit" href="/" display="flex" alignItems="center">
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Home
                </Link>
                <Typography color="text.primary">Category Management</Typography>
              </Breadcrumbs>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Enhanced Category Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage categories with advanced hierarchy, SEO, and analytics features
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <ActionButton
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
              >
                Refresh
              </ActionButton>
              <ActionButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCategory}
              >
                Create Category
              </ActionButton>
            </Box>
          </Box>
          
          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              {renderStatsCard(
                'Total Categories',
                stats.totalCategories,
                <CategoryIcon />,
                theme.palette.primary.main
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderStatsCard(
                'Active Categories',
                stats.activeCategories,
                <TrendingUpIcon />,
                theme.palette.success.main
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderStatsCard(
                'Root Categories',
                stats.rootCategories,
                <CategoryIcon />,
                theme.palette.info.main
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderStatsCard(
                'Total Views',
                stats.totalViews,
                <TrendingUpIcon />,
                theme.palette.warning.main
              )}
            </Grid>
          </Grid>
        </CardContent>
      </HeaderCard>

      {/* Category Type Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Category Type Breakdown
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label={`Services: ${stats.serviceCategories}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Products: ${stats.productCategories}`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Both: ${stats.bothCategories}`}
              color="default"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Category List */}
      <EnhancedCategoryList
        onCategoryEdit={handleEditCategory}
        onCategoryDelete={handleDeleteCategory}
        onCategoryCreate={handleCreateCategory}
        showStats={true}
      />

      {/* Category Form Dialog */}
      <EnhancedCategoryForm
        open={showCategoryForm}
        onClose={handleCategoryFormClose}
        category={editingCategory}
        parentCategories={categories.filter(c => c.level < 3)} // Only show categories that can have children
        onSuccess={handleCategoryFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <Dialog open={!!deletingCategory} onClose={() => setDeletingCategory(null)}>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deletingCategory.name}"? This action cannot be undone.
            </Typography>
            {deletingCategory.childrenCount > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This category has {deletingCategory.childrenCount} subcategories. 
                Deleting it will also delete all subcategories.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeletingCategory(null)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  )
}
