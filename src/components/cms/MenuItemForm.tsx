import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
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
  Divider,
  Chip,
  Alert,
  Autocomplete,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material'
import type { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest } from '../../types'

interface MenuItemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateMenuItemRequest | UpdateMenuItemRequest) => Promise<void>
  menuItem?: MenuItem | null
  parentItems?: MenuItem[]
  maxDepth?: number
}

const MENU_ITEM_TYPES = [
  { value: 'link', label: 'Custom Link' },
  { value: 'page', label: 'Page' },
  { value: 'category', label: 'Category' },
  { value: 'custom', label: 'Custom' },
  { value: 'divider', label: 'Divider' },
]

const TARGET_OPTIONS = [
  { value: '_self', label: 'Same Window' },
  { value: '_blank', label: 'New Window' },
  { value: '_parent', label: 'Parent Frame' },
  { value: '_top', label: 'Top Frame' },
]

export function MenuItemForm({
  open,
  onClose,
  onSubmit,
  menuItem,
  parentItems = [],
  maxDepth = 3,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<CreateMenuItemRequest>({
    label: '',
    url: '',
    type: 'link',
    target: '_self',
    icon: '',
    cssClass: '',
    order: 0,
    isActive: true,
    parentId: undefined,
    metadata: {},
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (menuItem) {
      setFormData({
        label: menuItem.label || '',
        url: menuItem.url || '',
        type: menuItem.type || 'link',
        target: menuItem.target || '_self',
        icon: menuItem.icon || '',
        cssClass: menuItem.cssClass || '',
        order: menuItem.order || 0,
        isActive: menuItem.isActive !== undefined ? menuItem.isActive : true,
        parentId: menuItem.parentId,
        metadata: menuItem.metadata || {},
      })
    } else {
      setFormData({
        label: '',
        url: '',
        type: 'link',
        target: '_self',
        icon: '',
        cssClass: '',
        order: 0,
        isActive: true,
        parentId: undefined,
        metadata: {},
      })
    }
    setErrors({})
  }, [menuItem, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required'
    }

    if (formData.type !== 'divider' && !formData.url && formData.type === 'link') {
      newErrors.url = 'URL is required for link type'
    }

    if (formData.type === 'page' && !formData.metadata?.pageId) {
      newErrors.pageId = 'Page selection is required'
    }

    if (formData.type === 'category' && !formData.metadata?.categoryId) {
      newErrors.categoryId = 'Category selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting menu item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      label: '',
      url: '',
      type: 'link',
      target: '_self',
      icon: '',
      cssClass: '',
      order: 0,
      isActive: true,
      parentId: undefined,
      metadata: {},
    })
    setErrors({})
    onClose()
  }

  const getCurrentDepth = (): number => {
    if (!formData.parentId) return 0
    const findDepth = (id: string | undefined, items: MenuItem[], depth = 0): number => {
      if (!id) return depth
      const item = items.find((i) => (i.id || i._id) === id)
      if (!item) return depth
      return findDepth(item.parentId, items, depth + 1)
    }
    return findDepth(formData.parentId, parentItems)
  }

  const canAddChild = getCurrentDepth() < maxDepth - 1

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">
            {menuItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </Typography>
          {menuItem && (
            <Chip
              label={menuItem.type}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Item Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={formData.type}
                label="Item Type"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
              >
                {MENU_ITEM_TYPES.map((type) => (
                  <MuiMenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MuiMenuItem>
                ))}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.type}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Parent Item */}
          {parentItems.length > 0 && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Item (Optional)</InputLabel>
                <Select
                  value={formData.parentId || ''}
                  label="Parent Item (Optional)"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value || undefined,
                    })
                  }
                >
                  <MuiMenuItem value="">None (Top Level)</MuiMenuItem>
                  {parentItems
                    .filter((item) => (item.id || item._id) !== menuItem?.id && (item.id || item._id) !== menuItem?._id)
                    .map((item) => (
                      <MuiMenuItem key={item.id || item._id} value={item.id || item._id}>
                        {item.label}
                      </MuiMenuItem>
                    ))}
                </Select>
              </FormControl>
              {!canAddChild && formData.parentId && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Maximum depth reached. Cannot add more nested items.
                </Alert>
              )}
            </Grid>
          )}

          {/* Label */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Menu Item Label"
              required
              error={!!errors.label}
              helperText={errors.label}
            />
          </Grid>

          {/* URL - Show for link and custom types */}
          {(formData.type === 'link' || formData.type === 'custom') && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/page or https://example.com"
                error={!!errors.url}
                helperText={errors.url || 'Enter relative path or full URL'}
              />
            </Grid>
          )}

          {/* Target - Show for link types */}
          {formData.type === 'link' && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Open In</InputLabel>
                <Select
                  value={formData.target}
                  label="Open In"
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value as any })
                  }
                >
                  {TARGET_OPTIONS.map((option) => (
                    <MuiMenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Page Selection - Show for page type */}
          {formData.type === 'page' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Page selection will be integrated with your pages API. For now, use custom link type.
              </Alert>
              <TextField
                fullWidth
                label="Page URL"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/page-slug"
                helperText="Enter the page slug or URL"
              />
            </Grid>
          )}

          {/* Category Selection - Show for category type */}
          {formData.type === 'category' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Category selection will be integrated with your categories API. For now, use custom link type.
              </Alert>
              <TextField
                fullWidth
                label="Category URL"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/category-slug"
                helperText="Enter the category slug or URL"
              />
            </Grid>
          )}

          {/* Icon */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Icon (Optional)"
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="home, settings, etc."
              helperText="Material-UI icon name or custom class"
            />
          </Grid>

          {/* CSS Class */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CSS Class (Optional)"
              value={formData.cssClass || ''}
              onChange={(e) => setFormData({ ...formData, cssClass: e.target.value })}
              placeholder="custom-class"
              helperText="Additional CSS classes"
            />
          </Grid>

          {/* Order */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Order"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
              }
              inputProps={{ min: 0 }}
              helperText="Lower numbers appear first"
            />
          </Grid>

          {/* Active Status */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Grid>

          {/* Divider Note */}
          {formData.type === 'divider' && (
            <Grid item xs={12}>
              <Alert severity="info">
                Divider items are visual separators and don't require a label or URL.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : menuItem ? 'Update' : 'Add'} Menu Item
        </Button>
      </DialogActions>
    </Dialog>
  )
}

