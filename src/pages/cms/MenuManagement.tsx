import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Menu,
  Eye,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Search,
  ListFilter,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { MenuService } from '../../services/api/menu.service'
import { MenuItemForm } from '../../components/cms/MenuItemForm'
import { ConfirmDialog, EmptyState } from '../../components/common'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Textarea,
} from '../../components/ui'
import { cn } from '../../lib/utils'
import type {
  Menu as MenuType,
  MenuItem,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
} from '../../types'

function locationBadgeVariant(
  location: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  switch (location) {
    case 'header':
      return 'default'
    case 'footer':
      return 'secondary'
    case 'sidebar':
      return 'outline'
    case 'mobile':
      return 'success'
    default:
      return 'warning'
  }
}

export default function MenuManagement() {
  const [menus, setMenus] = useState<MenuType[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [showMenuItemForm, setShowMenuItemForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuType | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<MenuType | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'menus' | 'items'>('menus')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    type: 'menu' | 'item'
    id?: string
    menuId?: string
    name?: string
  }>({ open: false, type: 'menu' })

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

  useEffect(() => {
    if (!selectedMenu && tab === 'items') {
      setTab('menus')
    }
  }, [selectedMenu, tab])

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
        setTab('menus')
      }
      setDeleteConfirm({ open: false, type: 'menu' })
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const handleAddMenuItem = async (data: CreateMenuItemRequest) => {
    if (!selectedMenu) return
    try {
      await MenuService.addMenuItem(selectedMenu.id || selectedMenu._id || '', data)
      await fetchMenus()
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
      await MenuService.updateMenuItem(selectedMenu.id || selectedMenu._id || '', itemId, data)
      await fetchMenus()
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
      const updated = await MenuService.getMenuById(deleteConfirm.menuId)
      setSelectedMenu(updated.data?.menu || updated.menu)
      setDeleteConfirm({ open: false, type: 'item' })
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const handleToggleMenuStatus = async (menu: MenuType) => {
    try {
      await MenuService.toggleMenuStatus(menu.id || menu._id || '', !menu.isActive)
      await fetchMenus()
      if (selectedMenu?.id === menu.id || selectedMenu?._id === menu._id) {
        const updated = await MenuService.getMenuById(menu.id || menu._id || '')
        setSelectedMenu(updated.data?.menu || updated.menu)
      }
    } catch (error) {
      console.error('Error toggling menu status:', error)
    }
  }

  const handleDuplicateMenu = async (menu: MenuType) => {
    try {
      await MenuService.duplicateMenu(menu.id || menu._id || '', `${menu.name} (Copy)`)
      await fetchMenus()
    } catch (error) {
      console.error('Error duplicating menu:', error)
    }
  }

  const handleEditMenu = (menu: MenuType) => {
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

  const handleSelectMenu = async (menu: MenuType) => {
    try {
      const response = await MenuService.getMenuById(menu.id || menu._id || '')
      setSelectedMenu(response.data?.menu || response.menu)
      setTab('items')
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

  const renderMenuItem = (item: MenuItem, level = 0): React.ReactNode => {
    const itemId = item.id || item._id || ''
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(itemId)
    const indent = level * 2

    return (
      <React.Fragment key={itemId}>
        <div
          className={cn(
            'flex items-start gap-3 border-b border-border/80 py-3 pr-2',
            level > 0 && 'border-l-2 border-border pl-2',
            level % 2 === 1 && 'bg-muted/30',
          )}
          style={{ paddingLeft: `${1 + indent}rem` }}
        >
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {hasChildren ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => toggleItemExpansion(itemId)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            ) : (
              <span className="w-8 shrink-0" />
            )}
            <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-sm', level === 0 ? 'font-semibold' : 'font-normal')}>
                  {item.label}
                </span>
                {item.type !== 'link' ? (
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                ) : null}
                {!item.isActive ? (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {item.url ? <span>{item.url}</span> : null}
                {item.target === '_blank' ? (
                  <Badge variant="outline" className="text-[10px]">
                    New Tab
                  </Badge>
                ) : null}
                <span>Order: {item.order}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditMenuItem(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
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
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {hasChildren && isExpanded ? (
          <div className="border-b border-border/60">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        ) : null}
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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage navigation menus for your website
            </p>
          </div>
          <Button onClick={() => setShowMenuForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Menu
          </Button>
        </div>

        <div
          className="mb-6 rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm text-primary dark:border-primary/50 dark:bg-primary/40 dark:text-primary-deep"
          role="status"
        >
          <strong>Note:</strong> Menu item builder with drag-and-drop functionality can be added in a future enhancement.
          The current structure supports nested menu items and is ready for drag-and-drop integration. For now, create
          menus and add items via the UI or API.
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'menus' | 'items')}>
          <TabsList className="mb-4">
            <TabsTrigger value="menus">All Menus</TabsTrigger>
            {selectedMenu ? <TabsTrigger value="items">{selectedMenu.name}</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="menus" className="mt-0">
            <Card className="mb-6 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                <div className="md:col-span-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-9 pl-9"
                      placeholder="Search menus..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full"
                    onClick={fetchMenus}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </Card>

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
              <div className="grid grid-cols-1 gap-4">
                {filteredMenus.map((menu) => (
                  <Card key={menu.id || menu._id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Menu className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">{menu.name}</h3>
                            <Badge variant={menu.isActive ? 'success' : 'secondary'} className="gap-1">
                              {menu.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {menu.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant={locationBadgeVariant(menu.location)} className="capitalize">
                              {menu.location}
                            </Badge>
                          </div>
                          <div className="mb-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>
                              <strong className="text-foreground">Slug:</strong>{' '}
                              <code className="rounded bg-muted px-1 py-0.5 text-xs">{menu.slug}</code>
                            </span>
                            <span>{menu.items?.length || 0} menu items</span>
                          </div>
                          {menu.description ? (
                            <p className="mb-2 text-sm text-muted-foreground">{menu.description}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(menu.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-primary"
                                onClick={() => handleSelectMenu(menu)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View &amp; Edit Items</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-primary"
                                onClick={() => handleEditMenu(menu)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Menu</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" size="icon" variant="ghost" onClick={() => handleDuplicateMenu(menu)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" size="icon" variant="ghost" onClick={() => handleToggleMenuStatus(menu)}>
                                {menu.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{menu.isActive ? 'Deactivate' : 'Activate'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'menu',
                                    id: menu.id || menu._id,
                                    name: menu.name,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {selectedMenu ? (
            <TabsContent value="items" className="mt-0">
              <Card className="mb-6 p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedMenu.name}</h2>
                    <nav className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-muted-foreground"
                        onClick={() => setTab('menus')}
                      >
                        Menus
                      </Button>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-foreground">{selectedMenu.name}</span>
                    </nav>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingMenuItem(null)
                      setShowMenuItemForm(true)
                    }}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Menu Item
                  </Button>
                </div>
              </Card>

              {selectedMenu.items && selectedMenu.items.length > 0 ? (
                <Card>
                  <div className="divide-y divide-border">{selectedMenu.items
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item) => renderMenuItem(item))}</div>
                </Card>
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
            </TabsContent>
          ) : null}
        </Tabs>

        <Dialog open={showMenuForm} onOpenChange={(open) => !open && handleCloseMenuForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMenu ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="menu-name">Menu Name</Label>
                <Input
                  id="menu-name"
                  value={menuFormData.name}
                  onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                  placeholder="Main Navigation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-slug">Slug (optional)</Label>
                <Input
                  id="menu-slug"
                  value={menuFormData.slug}
                  onChange={(e) => setMenuFormData({ ...menuFormData, slug: e.target.value })}
                  placeholder="main-navigation"
                />
                <p className="text-xs text-muted-foreground">Auto-generated from name if empty</p>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={menuFormData.location}
                  onValueChange={(v) =>
                    setMenuFormData({
                      ...menuFormData,
                      location: v as CreateMenuRequest['location'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-desc">Description</Label>
                <Textarea
                  id="menu-desc"
                  rows={3}
                  value={menuFormData.description}
                  onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={menuFormData.isActive}
                  onCheckedChange={(checked) => setMenuFormData({ ...menuFormData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCloseMenuForm}>
                Cancel
              </Button>
              <Button type="button" onClick={editingMenu ? handleUpdateMenu : handleCreateMenu}>
                {editingMenu ? 'Update' : 'Create'} Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
    </TooltipProvider>
  )
}
