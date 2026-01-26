import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIndicatorIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { MenuService } from '../../services/api/menu.service'
import { MenuItemForm } from '../../components/cms/MenuItemForm'
import { ConfirmDialog, EmptyState } from '../../components/common'
import type {
  Menu,
  MenuItem,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
} from '../../types'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`menu-tabpanel-${index}`}
      aria-labelledby={`menu-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [showMenuItemForm, setShowMenuItemForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [tabValue, setTabValue] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    type: 'menu' | 'item'
    id?: string
    menuId?: string
    name?: string
  }>({ open: false, type: 'menu' })

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [menuFormData, setMenuFormData] = useState<CreateMenuRequest>({
    name: '',
    slug: '',
    location: 'header',
    description: '',
    isActive: true,
    items: [],
    settings: {
      maxDepth: 3,
      showIcons: true,
      collapseOnMobile: true,
    },
  })

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await MenuService.getMenus({
        location: locationFilter !== 'all' ? (locationFilter as any) : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        search: searchQuery || undefined,
      })
      setMenus(response.data?.menus || response.menus || [])
    } catch (error) {
      console.error('Error fetching menus:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMenu = async () => {
    try {
      await MenuService.createMenu(menuFormData)
      await fetchMenus()
      handleCloseMenuForm()
    } catch (error) {
      console.error('Error creating menu:', error)
    }
  }

  const handleUpdateMenu = async () => {
    if (!editingMenu) return
    try {
      await MenuService.updateMenu(editingMenu.id || editingMenu._id || '', menuFormData)
      await fetchMenus()
      handleCloseMenuForm()
    } catch (error) {
      console.error('Error updating menu:', error)
    }
  }

  const handleDeleteMenu = async () => {
    if (!deleteConfirm.id) return
    try {
      await MenuService.deleteMenu(deleteConfirm.id)
      await fetchMenus()
      if (selectedMenu?.id === deleteConfirm.id || selectedMenu?._id === deleteConfirm.id) {
        setSelectedMenu(null)
        setTabValue(0)
      }
      setDeleteConfirm({ open: false, type: 'menu' })
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const handleAddMenuItem = async (data: CreateMenuItemRequest) => {
    if (!selectedMenu) return
    try {
      await MenuService.addMenuItem(
        selectedMenu.id || selectedMenu._id || '',
        data
      )
      await fetchMenus()
      // Refresh selected menu
      const updated = await MenuService.getMenuById(selectedMenu.id || selectedMenu._id || '')
      setSelectedMenu(updated.data?.menu || updated.menu)
      setShowMenuItemForm(false)
      setEditingMenuItem(null)
    } catch (error) {
      console.error('Error adding menu item:', error)
      throw error
    }
  }

  const handleUpdateMenuItem = async (data: CreateMenuItemRequest) => {
    if (!selectedMenu || !editingMenuItem) return
    try {
      const itemId = editingMenuItem.id || editingMenuItem._id || ''
      await MenuService.updateMenuItem(
        selectedMenu.id || selectedMenu._id || '',
        itemId,
        data
      )
      await fetchMenus()
      // Refresh selected menu
      const updated = await MenuService.getMenuById(selectedMenu.id || selectedMenu._id || '')
      setSelectedMenu(updated.data?.menu || updated.menu)
      setShowMenuItemForm(false)
      setEditingMenuItem(null)
    } catch (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
  }

  const handleDeleteMenuItem = async () => {
    if (!deleteConfirm.id || !deleteConfirm.menuId) return
    try {
      await MenuService.deleteMenuItem(deleteConfirm.menuId, deleteConfirm.id)
      await fetchMenus()
      // Refresh selected menu
      const updated = await MenuService.getMenuById(deleteConfirm.menuId)
      setSelectedMenu(updated.data?.menu || updated.menu)
      setDeleteConfirm({ open: false, type: 'item' })
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const handleToggleMenuStatus = async (menu: Menu) => {
    try {
      await MenuService.toggleMenuStatus(
        menu.id || menu._id || '',
        !menu.isActive
      )
      await fetchMenus()
      if (selectedMenu?.id === menu.id || selectedMenu?._id === menu._id) {
        const updated = await MenuService.getMenuById(menu.id || menu._id || '')
        setSelectedMenu(updated.data?.menu || updated.menu)
      }
    } catch (error) {
      console.error('Error toggling menu status:', error)
    }
  }

  const handleDuplicateMenu = async (menu: Menu) => {
    try {
      await MenuService.duplicateMenu(menu.id || menu._id || '', `${menu.name} (Copy)`)
      await fetchMenus()
    } catch (error) {
      console.error('Error duplicating menu:', error)
    }
  }

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu)
    setMenuFormData({
      name: menu.name,
      slug: menu.slug,
      location: menu.location,
      description: menu.description || '',
      isActive: menu.isActive,
      items: menu.items || [],
      settings: menu.settings || {
        maxDepth: 3,
        showIcons: true,
        collapseOnMobile: true,
      },
    })
    setShowMenuForm(true)
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item)
    setShowMenuItemForm(true)
  }

  const handleCloseMenuForm = () => {
    setMenuFormData({
      name: '',
      slug: '',
      location: 'header',
      description: '',
      isActive: true,
      items: [],
      settings: {
        maxDepth: 3,
        showIcons: true,
        collapseOnMobile: true,
      },
    })
    setEditingMenu(null)
    setShowMenuForm(false)
  }

  const handleSelectMenu = async (menu: Menu) => {
    try {
      const response = await MenuService.getMenuById(menu.id || menu._id || '')
      setSelectedMenu(response.data?.menu || response.menu)
      setTabValue(1)
    } catch (error) {
      console.error('Error loading menu:', error)
    }
  }

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'header':
        return 'primary'
      case 'footer':
        return 'secondary'
      case 'sidebar':
        return 'info'
      case 'mobile':
        return 'success'
      default:
        return 'default'
    }
  }

  const renderMenuItem = (item: MenuItem, level = 0): React.ReactNode => {
    const itemId = item.id || item._id || ''
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(itemId)
    const indent = level * 2

    return (
      <React.Fragment key={itemId}>
        <ListItem
          sx={{
            pl: `${2 + indent}rem`,
            borderLeft: level > 0 ? '2px solid' : 'none',
            borderColor: 'divider',
            bgcolor: level % 2 === 0 ? 'transparent' : 'action.hover',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {hasChildren && (
              <IconButton
                size="small"
                onClick={() => toggleItemExpansion(itemId)}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 32 }} />}
            <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={level === 0 ? 600 : 400}>
                    {item.label}
                  </Typography>
                  {item.type !== 'link' && (
                    <Chip label={item.type} size="small" variant="outlined" />
                  )}
                  {!item.isActive && (
                    <Chip label="Inactive" size="small" color="default" />
                  )}
                </Stack>
              }
              secondary={
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  {item.url && (
                    <Typography variant="caption" color="text.secondary">
                      {item.url}
                    </Typography>
                  )}
                  {item.target === '_blank' && (
                    <Chip label="New Tab" size="small" variant="outlined" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Order: {item.order}
                  </Typography>
                </Stack>
              }
            />
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => handleEditMenuItem(item)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setDeleteConfirm({
                        open: true,
                        type: 'item',
                        id: itemId,
                        menuId: selectedMenu?.id || selectedMenu?._id,
                        name: item.label,
                      })
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItemSecondaryAction>
          </Box>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchesSearch =
        !searchQuery ||
        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.slug.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLocation = locationFilter === 'all' || menu.location === locationFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && menu.isActive) ||
        (statusFilter === 'inactive' && !menu.isActive)
      return matchesSearch && matchesLocation && matchesStatus
    })
  }, [menus, searchQuery, locationFilter, statusFilter])

  if (loading && menus.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Menu Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage navigation menus for your website
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowMenuForm(true)}
        >
          New Menu
        </Button>
      </Box>

      {/* Note about drag-and-drop */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Menu item builder with drag-and-drop functionality can be added in a future enhancement. 
          The current structure supports nested menu items and is ready for drag-and-drop integration. 
          For now, create menus and add items via the UI or API.
        </Typography>
      </Alert>

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Menus" />
        {selectedMenu && <Tab label={selectedMenu.name} />}
      </Tabs>

      {/* All Menus Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <MuiMenuItem value="all">All Locations</MuiMenuItem>
                  <MuiMenuItem value="header">Header</MuiMenuItem>
                  <MuiMenuItem value="footer">Footer</MuiMenuItem>
                  <MuiMenuItem value="sidebar">Sidebar</MuiMenuItem>
                  <MuiMenuItem value="mobile">Mobile</MuiMenuItem>
                  <MuiMenuItem value="custom">Custom</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MuiMenuItem value="all">All Status</MuiMenuItem>
                  <MuiMenuItem value="active">Active</MuiMenuItem>
                  <MuiMenuItem value="inactive">Inactive</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchMenus}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Menus List */}
        {filteredMenus.length === 0 ? (
          <EmptyState
            title="No menus found"
            description={
              searchQuery || locationFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first menu to get started'
            }
            action={{
              label: 'Create Menu',
              onClick: () => setShowMenuForm(true),
            }}
          />
      ) : (
        <Grid container spacing={2}>
            {filteredMenus.map((menu) => (
              <Grid item xs={12} key={menu.id || menu._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <MenuIcon color="action" />
                          <Typography variant="h6" fontWeight="600">
                            {menu.name}
                          </Typography>
                        <Chip
                          label={menu.isActive ? 'Active' : 'Inactive'}
                          color={menu.isActive ? 'success' : 'default'}
                          size="small"
                            icon={menu.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                        <Chip
                          label={menu.location}
                            color={getLocationColor(menu.location) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Slug:</strong> <code>{menu.slug}</code>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {menu.items?.length || 0} menu items
                        </Typography>
                      </Stack>

                        {menu.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {menu.description}
                          </Typography>
                        )}

                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(menu.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title="View & Edit Items">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSelectMenu(menu)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Menu">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditMenu(menu)}
                          >
                        <EditIcon />
                      </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateMenu(menu)}
                          >
                            <DuplicateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={menu.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleMenuStatus(menu)}
                          >
                            {menu.isActive ? <CancelIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: 'menu',
                                id: menu.id || menu._id,
                                name: menu.name,
                              })
                            }
                          >
                        <DeleteIcon />
                      </IconButton>
                        </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </TabPanel>

      {/* Menu Items Tab */}
      <TabPanel value={tabValue} index={1}>
        {selectedMenu ? (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedMenu.name}
                  </Typography>
                  <Breadcrumbs>
                    <MuiLink color="inherit" href="#" onClick={() => setTabValue(0)}>
                      Menus
                    </MuiLink>
                    <Typography color="text.primary">{selectedMenu.name}</Typography>
                  </Breadcrumbs>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingMenuItem(null)
                    setShowMenuItemForm(true)
                  }}
                >
                  Add Menu Item
                </Button>
              </Stack>
            </Paper>

            {selectedMenu.items && selectedMenu.items.length > 0 ? (
              <Paper>
                <List>
                  {selectedMenu.items
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item) => renderMenuItem(item))}
                </List>
              </Paper>
            ) : (
              <EmptyState
                title="No menu items"
                description="Add your first menu item to get started"
                action={{
                  label: 'Add Menu Item',
                  onClick: () => {
                    setEditingMenuItem(null)
                    setShowMenuItemForm(true)
                  },
                }}
              />
            )}
          </Box>
        ) : (
          <Alert severity="info">Select a menu to view and manage its items</Alert>
        )}
      </TabPanel>

      {/* Menu Form Dialog */}
      <Dialog open={showMenuForm} onClose={handleCloseMenuForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMenu ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Menu Name"
                value={menuFormData.name}
                onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                placeholder="Main Navigation"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug (optional)"
                value={menuFormData.slug}
                onChange={(e) => setMenuFormData({ ...menuFormData, slug: e.target.value })}
                placeholder="main-navigation"
                helperText="Auto-generated from name if empty"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={menuFormData.location}
                  label="Location"
                  onChange={(e) =>
                    setMenuFormData({
                      ...menuFormData,
                      location: e.target.value as any,
                    })
                  }
                  required
                >
                  <MuiMenuItem value="header">Header</MuiMenuItem>
                  <MuiMenuItem value="footer">Footer</MuiMenuItem>
                  <MuiMenuItem value="sidebar">Sidebar</MuiMenuItem>
                  <MuiMenuItem value="mobile">Mobile</MuiMenuItem>
                  <MuiMenuItem value="custom">Custom</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={menuFormData.description}
                onChange={(e) =>
                  setMenuFormData({ ...menuFormData, description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={menuFormData.isActive}
                    onChange={(e) =>
                      setMenuFormData({ ...menuFormData, isActive: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMenuForm}>Cancel</Button>
          <Button variant="contained" onClick={editingMenu ? handleUpdateMenu : handleCreateMenu}>
            {editingMenu ? 'Update' : 'Create'} Menu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu Item Form */}
      <MenuItemForm
        open={showMenuItemForm}
        onClose={() => {
          setShowMenuItemForm(false)
          setEditingMenuItem(null)
        }}
        onSubmit={async (data: CreateMenuItemRequest | UpdateMenuItemRequest) => {
          if (editingMenuItem) {
            await handleUpdateMenuItem(data as any)
          } else {
            await handleAddMenuItem(data as any)
          }
        }}
        menuItem={editingMenuItem}
        parentItems={selectedMenu?.items || []}
        maxDepth={selectedMenu?.settings?.maxDepth || 3}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onCancel={() => setDeleteConfirm({ open: false, type: 'menu' })}
        onConfirm={() => {
          void (deleteConfirm.type === 'menu' ? handleDeleteMenu() : handleDeleteMenuItem())
        }}
        title={`Delete ${deleteConfirm.type === 'menu' ? 'Menu' : 'Menu Item'}?`}
        message={
          deleteConfirm.type === 'menu'
            ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteConfirm.name}"? This will also remove all child items.`
        }
      />
    </Box>
  )
}
