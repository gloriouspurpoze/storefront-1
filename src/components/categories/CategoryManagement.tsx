import React, { useState } from 'react'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  TrendingUp as TrendingIcon,
  Download as ExportIcon,
  Settings as SettingsIcon,
  Bolt as ElectricIcon,
  CleaningServices as CleaningIcon,
  Palette as DesignIcon,
  FitnessCenter as FitnessIcon,
  AcUnit as AcIcon,
} from '@mui/icons-material'

// Import our UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  VStack,
  HStack,
  Badge,
  Input,
  Label,
} from '../ui'
import { EmptyState, StatusBadge, DataTable } from '../common'

// Types
interface Category {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  iconColor: string
  backgroundColor: string
  status: 'active' | 'inactive'
  servicesCount: number
  isPopular?: boolean
  isFeatured?: boolean
  createdAt: string
  updatedAt: string
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Filter categories based on search and status
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || cat.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.status === 'active').length
  const totalServices = categories.reduce((sum, cat) => sum + cat.servicesCount, 0)
  const popularCategories = categories.filter(c => c.isPopular).length

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setAnchorEl(event.currentTarget)
    setSelectedCategory(category)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    setShowCategoryModal(true)
    handleMenuClose()
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
    handleMenuClose()
  }

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      setCategories(categories.filter(c => c.id !== selectedCategory.id))
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' })
      setShowDeleteDialog(false)
      setSelectedCategory(null)
    }
  }

  return (
    <Box className="p-6">
      <VStack spacing={6}>
        {/* Header */}
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Service Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your service categories and subcategories
          </Typography>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent>
            <HStack spacing={3}>
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              
              <Button
                variant="default"
                leftIcon={<AddIcon />}
                onClick={() => setShowCategoryModal(true)}
              >
                Add Category
              </Button>
            </HStack>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <VStack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Categories
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {totalCategories}
                </Typography>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <VStack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Active Categories
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {activeCategories}
                </Typography>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <VStack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Services
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {totalServices}
                </Typography>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <VStack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Popular Categories
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {popularCategories}
                </Typography>
              </VStack>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <EmptyState
                title="No categories found"
                description={searchTerm ? "Try adjusting your search" : "Get started by adding your first category"}
                action={{
                  label: "Add Category",
                  onClick: () => setShowCategoryModal(true)
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <HStack spacing={3}>
                      <Avatar sx={{ bgcolor: category.backgroundColor }}>
                        {category.icon}
                      </Avatar>
                      <div>
                        <Typography variant="body1" fontWeight="600">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.servicesCount} services
                        </Typography>
                      </div>
                    </HStack>

                    <HStack spacing={2}>
                      <Badge variant={category.status === 'active' ? 'success' : 'secondary'}>
                        {category.status}
                      </Badge>
                      
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, category)}>
                        <MoreVertIcon />
                      </IconButton>
                    </HStack>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </VStack>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { /* View logic */ handleMenuClose() }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
