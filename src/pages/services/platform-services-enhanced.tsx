import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Stack,
  Paper,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { platformServicesService, PlatformService } from '../../services/api/platformServices.service'
import { CategoriesService } from '../../services/api/categories.service'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../lib/utils'

const CATEGORIES = [
  'home_repair',
  'home_improvement',
  'cleaning',
  'outdoor',
  'maintenance',
  'installation',
]

/** API may return number or (legacy) string; keeps TS happy vs `!== ''` on number. */
function hasDisplayableBasePrice(v: number | string | undefined | null): boolean {
  if (v == null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  const n = Number(v)
  return !Number.isNaN(n)
}

function displayBasePrice(v: number | string | undefined | null): string {
  if (!hasDisplayableBasePrice(v)) return 'N/A'
  return formatCurrency(Number(v))
}

export function PlatformServicesEnhanced() {
  const navigate = useNavigate()
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  // Category id -> name (lowercase id for lookup; API returns lowercase ids)
  const [categoryNameById, setCategoryNameById] = useState<Record<string, string>>({})

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState(0)
  const [selectedService, setSelectedService] = useState<PlatformService | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuService, setMenuService] = useState<PlatformService | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
  })

  // Fetch categories for name lookup (API returns category as id string)
  useEffect(() => {
    let isMounted = true
    const loadLookups = async () => {
      try {
        const cats = await CategoriesService.getCategoriesForServiceUIs({
          page: 1,
          limit: 500,
          is_active: true,
        }).catch(() => [] as { id: string; name: string }[])
        if (!isMounted) return
        const byId: Record<string, string> = {}
        ;(Array.isArray(cats) ? cats : []).forEach((c: any) => {
          const id = (c?.id ?? c?._id ?? '').toString().toLowerCase()
          const name = (c?.name ?? c?.title ?? '').toString().trim()
          if (id) byId[id] = name || id
        })
        setCategoryNameById(byId)
      } catch {
        // ignore
      }
    }
    loadLookups()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (isMounted) {
        await Promise.all([fetchServices(), fetchStats()])
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [page, rowsPerPage, selectedCategory, selectedStatus, searchTerm])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      }

      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }

      if (selectedStatus !== 'all') {
        params.is_active = selectedStatus === 'active'
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await platformServicesService.getServices(params)
      
      if (response && response.services) {
        setServices(response.services)
        setTotalCount(response.pagination?.total || 0)
      } else {
        setServices([])
        setTotalCount(0)
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch services', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await platformServicesService.getServiceStats()
      
      if (statsData) {
        setStats({
          total: statsData.total_services || 0,
          active: statsData.active_services || 0,
          featured: statsData.featured_services || 0,
        })
      }
    } catch (error) {
      setStats({ total: 0, active: 0, featured: 0 })
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, service: PlatformService) => {
    setAnchorEl(event.currentTarget)
    setMenuService(service)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuService(null)
  }

  const handleCreate = () => {
    navigate('/platform-services/create')
  }

  const handleEdit = (service: PlatformService) => {
    // Navigate to edit page with service ID
    navigate(`/platform-services/edit/${service.id}`)
    handleMenuClose()
  }

  const handlePreview = (service: PlatformService) => {
    setSelectedService(service)
    setPreviewDialogOpen(true)
    handleMenuClose()
  }

  const handleDelete = (service: PlatformService) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const confirmDelete = async () => {
    if (!selectedService) return

    try {
      await platformServicesService.deleteService(selectedService.id)
      showSnackbar('Service deleted successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete service', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedService(null)
    }
  }

  const handleToggleActive = async (service: PlatformService) => {
    try {
      await platformServicesService.updateService(service.id, {
        is_active: !service.is_active
      })
      showSnackbar(`Service ${!service.is_active ? 'activated' : 'deactivated'} successfully`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update service', 'error')
    }
  }

  const handleToggleFeatured = async (service: PlatformService) => {
    try {
      await platformServicesService.updateService(service.id, {
        is_featured: !service.is_featured
      })
      showSnackbar(`Service ${!service.is_featured ? 'featured' : 'unfeatured'} successfully`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update service', 'error')
    }
  }

  const getCategoryDisplayName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Uncategorized'
    const name = categoryNameById[String(categoryId).toLowerCase()]
    return name || categoryId
  }

  const handleDuplicate = async (service: PlatformService) => {
    try {
      const { id, slug, created_at, updated_at, ...serviceData } = service
      await platformServicesService.createService({
        ...serviceData,
        name: `${service.name} (Copy)`,
        slug: `${service.slug}-copy`,
        is_active: false,
        status: 'draft' as const
      })
      showSnackbar('Service duplicated successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to duplicate service', 'error')
    }
  }


  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedStatus('all')
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Compact Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.5
              }}
            >
              Platform Services
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              Manage your service offerings
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <ListViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreate}
              sx={{
                minWidth: 140,
                height: 36,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Add Service
            </Button>
          </Stack>
        </Box>
        
        {/* Compact Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', mr: 1 }}>📊</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Total
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              borderRadius: 2,
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', mr: 1 }}>✅</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Active
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 2,
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', mr: 1 }}>⭐</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Featured
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                  {stats.featured}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 2,
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', mr: 1 }}>📈</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Growth
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                  +12%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Compact Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              sx={{ textTransform: 'none', minWidth: 'auto' }}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </Box>
          
          {showFilters && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {(cat || '').replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Services Content */}
      {viewMode === 'list' ? (
        <Card sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Rating</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading services...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No services found
                        </Typography>
                        <Button 
                          variant="contained" 
                          startIcon={<AddIcon />} 
                          onClick={handleCreate}
                          size="small"
                        >
                          Create Service
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow 
                      key={service.id} 
                      hover
                      sx={{ 
                        '&:hover': {
                          bgcolor: 'primary.50',
                        }
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={service.image}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: 'primary.100',
                              color: 'primary.main'
                            }}
                          >
                            {service.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
                              {service.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {service.slug}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip 
                          label={getCategoryDisplayName(service.category)} 
                          size="small" 
                          sx={{ 
                            fontWeight: 500,
                            bgcolor: 'primary.100',
                            color: 'primary.700'
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" fontWeight="500">
                          {displayBasePrice(service.base_price)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={service.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={service.is_active ? 'success' : 'default'}
                            onClick={() => handleToggleActive(service)}
                            sx={{ 
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s'
                            }}
                          />
                          <Tooltip title={service.is_featured ? 'Remove from featured' : 'Mark as featured'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleFeatured(service)}
                              sx={{
                                color: service.is_featured ? 'warning.main' : 'action.disabled',
                                '&:hover': {
                                  bgcolor: 'warning.50'
                                }
                              }}
                            >
                              <StarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon fontSize="small" color="warning" />
                          <Typography variant="body2" fontWeight="500">
                            {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, service)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Card>
      ) : (
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={service.image}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: 'primary.100',
                          color: 'primary.main'
                        }}
                      >
                        {service.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0.5 }}>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getCategoryDisplayName(service.category)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, service)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {service.short_description || service.description?.substring(0, 100) + '...'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" color="primary.main" fontWeight="600">
                      {displayBasePrice(service.base_price)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon fontSize="small" color="warning" />
                      <Typography variant="caption" fontWeight="500">
                        {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={service.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={service.is_active ? 'success' : 'default'}
                      sx={{ fontWeight: 500 }}
                    />
                    {service.is_featured && (
                      <Tooltip title="Featured">
                        <StarIcon color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => menuService && handlePreview(menuService)}
          sx={{ py: 1.5, px: 2 }}
        >
          <ViewIcon sx={{ mr: 1.5, color: 'info.main' }} fontSize="small" />
          <Typography variant="body2" fontWeight={500}>View Details</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => menuService && handleEdit(menuService)}
          sx={{ py: 1.5, px: 2 }}
        >
          <EditIcon sx={{ mr: 1.5, color: 'warning.main' }} fontSize="small" />
          <Typography variant="body2" fontWeight={500}>Edit</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => menuService && handleDuplicate(menuService)}
          sx={{ py: 1.5, px: 2 }}
        >
          <CopyIcon sx={{ mr: 1.5, color: 'primary.main' }} fontSize="small" />
          <Typography variant="body2" fontWeight={500}>Duplicate</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem 
          onClick={() => menuService && handleToggleActive(menuService)}
          sx={{ py: 1.5, px: 2 }}
        >
          {menuService?.is_active ? (
            <>
              <CancelIcon sx={{ mr: 1.5, color: 'error.main' }} fontSize="small" />
              <Typography variant="body2" fontWeight={500}>Deactivate</Typography>
            </>
          ) : (
            <>
              <CheckCircleIcon sx={{ mr: 1.5, color: 'success.main' }} fontSize="small" />
              <Typography variant="body2" fontWeight={500}>Activate</Typography>
            </>
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => menuService && handleToggleFeatured(menuService)}
          sx={{ py: 1.5, px: 2 }}
        >
          <StarIcon sx={{ mr: 1.5, color: menuService?.is_featured ? 'action.disabled' : 'warning.main' }} fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            {menuService?.is_featured ? 'Unfeature' : 'Feature'}
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem 
          onClick={() => menuService && handleDelete(menuService)} 
          sx={{ py: 1.5, px: 2 }}
        >
          <DeleteIcon sx={{ mr: 1.5, color: 'error.main' }} fontSize="small" />
          <Typography variant="body2" fontWeight={500} color="error.main">Delete</Typography>
        </MenuItem>
      </Menu>


      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 24,
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 2,
            pt: 3,
            px: 4,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedService?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Service Preview
              </Typography>
            </Box>
            <IconButton
              onClick={() => setPreviewDialogOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedService && (
            <Box>
              {selectedService.image && (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 200, 
                    backgroundImage: `url(${selectedService.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Tabs for different sections */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={previewTab} 
                  onChange={(e, newValue) => setPreviewTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Overview" />
                  <Tab label="Pricing & Details" />
                  <Tab label="Features" />
                  <Tab label="Availability" />
                  <Tab label="Products" />
                </Tabs>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Overview Tab */}
                {previewTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        {selectedService.description}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
                            Pricing
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                            {displayBasePrice(selectedService.base_price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            GST: {selectedService.gst_percentage}% {selectedService.tax_included ? '(included)' : '(extra)'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'warning.main' }}>
                            Statistics
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {selectedService.total_requests || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Requests
                              </Typography>
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                  {selectedService.average_rating ? Number(selectedService.average_rating).toFixed(1) : '0.0'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Rating
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Status & Settings
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip 
                              label={selectedService.is_active ? 'Active' : 'Inactive'} 
                              color={selectedService.is_active ? 'success' : 'default'} 
                              size="small"
                            />
                            <Chip 
                              label={selectedService.status} 
                              color={selectedService.status === 'published' ? 'primary' : 'default'} 
                              size="small"
                            />
                            {selectedService.is_featured && (
                              <Chip label="Featured" color="warning" size="small" icon={<StarIcon />} />
                            )}
                            {selectedService.is_popular && (
                              <Chip label="Popular" color="secondary" size="small" />
                            )}
                            {selectedService.emergency_service && (
                              <Chip label="Emergency Service" color="error" size="small" />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Pricing & Details Tab */}
                {previewTab === 1 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                            Service Information
                          </Typography>
                          <Stack spacing={1.5}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Category</Typography>
                              <Typography variant="body2" fontWeight={500}>{getCategoryDisplayName(selectedService.category)}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Service Type</Typography>
                              <Typography variant="body2" fontWeight={500}>{selectedService.service_type}</Typography>
                            </Box>
                            {selectedService.duration && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Duration</Typography>
                                <Typography variant="body2" fontWeight={500}>{selectedService.duration}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
                            Pricing Details
                          </Typography>
                          <Stack spacing={1.5}>
                            {hasDisplayableBasePrice(selectedService.base_price) && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Base Price</Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {displayBasePrice(selectedService.base_price)}
                                </Typography>
                              </Box>
                            )}
                            {selectedService.hourly_rate && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Hourly Rate</Typography>
                                <Typography variant="body2" fontWeight={500}>₹{Number(selectedService.hourly_rate).toFixed(2)}/hour</Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="caption" color="text.secondary">GST</Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {selectedService.gst_percentage}% {selectedService.tax_included ? '(included)' : '(extra)'}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Features Tab */}
                {previewTab === 2 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                        Features
                      </Typography>
                      {selectedService.features && selectedService.features.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedService.features.map((feature, idx) => (
                            <Chip key={idx} label={feature} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No features added</Typography>
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                        Requirements
                      </Typography>
                      {selectedService.requirements && selectedService.requirements.length > 0 ? (
                        <List dense>
                          {selectedService.requirements.map((req, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={req} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No requirements specified</Typography>
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'info.main' }}>
                        Tags
                      </Typography>
                      {selectedService.tags && selectedService.tags.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedService.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="filled" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No tags added</Typography>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* Availability Tab */}
                {previewTab === 3 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Working Days
                          </Typography>
                          {selectedService.working_days && selectedService.working_days.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {selectedService.working_days.map((day, idx) => (
                                <Chip key={idx} label={day} size="small" color="primary" />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Not specified</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Time Slots
                          </Typography>
                          {selectedService.time_slots && selectedService.time_slots.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {selectedService.time_slots.map((slot, idx) => (
                                <Chip key={idx} label={slot} size="small" color="secondary" />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Not specified</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Booking Settings
                          </Typography>
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Advance Booking</Typography>
                              <Chip label={`${selectedService.advance_booking_hours || 24} hours`} size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Same-day Booking</Typography>
                              <Chip 
                                label={selectedService.same_day_booking ? 'Yes' : 'No'} 
                                size="small" 
                                color={selectedService.same_day_booking ? 'success' : 'default'}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Emergency Service</Typography>
                              <Chip 
                                label={selectedService.emergency_service ? 'Available' : 'Not Available'} 
                                size="small" 
                                color={selectedService.emergency_service ? 'error' : 'default'}
                              />
                            </Box>
                            {selectedService.emergency_charge && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Emergency Charge</Typography>
                                <Typography variant="body2" fontWeight={500}>₹{Number(selectedService.emergency_charge).toFixed(2)}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Products Tab */}
                {previewTab === 4 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        Product Options
                      </Typography>
                      {selectedService.product_options && selectedService.product_options.length > 0 ? (
                        <Stack spacing={2}>
                          {selectedService.product_options.map((product: any, idx: number) => (
                            <Card key={idx} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                  <Typography variant="subtitle2" fontWeight={600}>{product.name}</Typography>
                                  {product.price && (
                                    <Chip label={formatCurrency(Number(product.price))} size="small" color="success" />
                                  )}
                                </Box>
                                <Grid container spacing={1}>
                                  {product.brand && (
                                    <Grid size={{ xs: 6 }}>
                                      <Typography variant="caption" color="text.secondary">Brand</Typography>
                                      <Typography variant="body2">{product.brand}</Typography>
                                    </Grid>
                                  )}
                                  {product.warranty && (
                                    <Grid size={{ xs: 6 }}>
                                      <Typography variant="caption" color="text.secondary">Warranty</Typography>
                                      <Typography variant="body2">{product.warranty}</Typography>
                                    </Grid>
                                  )}
                                  {product.description && (
                                    <Grid size={{ xs: 12 }}>
                                      <Typography variant="caption" color="text.secondary">Description</Typography>
                                      <Typography variant="body2">{product.description}</Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No product options added</Typography>
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        Service Areas
                      </Typography>
                      {selectedService.service_areas && selectedService.service_areas.length > 0 ? (
                        <Stack spacing={1}>
                          {selectedService.service_areas.map((area: any, idx: number) => (
                            <Box 
                              key={idx} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: 'grey.50',
                                borderRadius: 1
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>{area.name}</Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={`${area.multiplier}x`} size="small" />
                                <Chip 
                                  label={area.active ? 'Active' : 'Inactive'} 
                                  size="small" 
                                  color={area.active ? 'success' : 'default'}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No service areas defined</Typography>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: 'grey.50', gap: 1 }}>
          <Button 
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setPreviewDialogOpen(false)
              selectedService && handleEdit(selectedService)
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Service"
        message={`Are you sure you want to delete "${selectedService?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setSelectedService(null)
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
