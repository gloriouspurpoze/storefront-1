import React, { useState, useEffect } from 'react'
import {
  Button,
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
  Badge,
  Separator,
} from '../ui'
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
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-left">
              {menuItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            {menuItem && (
              <Badge variant="outline" className="capitalize">
                {menuItem.type}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Item Type */}
          <div className="md:col-span-6">
            <div className="space-y-2">
              <Label htmlFor="menu-item-type">Item Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData({ ...formData, type: v as CreateMenuItemRequest['type'] })
                }
              >
                <SelectTrigger id="menu-item-type" className={errors.type ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Item Type" />
                </SelectTrigger>
                <SelectContent>
                  {MENU_ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type}</p>
              )}
            </div>
          </div>

          {/* Parent Item */}
          {parentItems.length > 0 && (
            <div className="md:col-span-6">
              <div className="space-y-2">
                <Label htmlFor="menu-parent">Parent Item (Optional)</Label>
                <Select
                  value={formData.parentId || '__none__'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      parentId: v === '__none__' ? undefined : v,
                    })
                  }
                >
                  <SelectTrigger id="menu-parent">
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (Top Level)</SelectItem>
                    {parentItems
                      .filter(
                        (item) =>
                          (item.id || item._id) !== menuItem?.id &&
                          (item.id || item._id) !== menuItem?._id,
                      )
                      .map((item) => (
                        <SelectItem key={item.id || item._id} value={String(item.id || item._id)}>
                          {item.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {!canAddChild && formData.parentId && (
                <div
                  className="mt-2 rounded-md border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral/50 dark:bg-bloom-coral/40 dark:text-bloom-deep"
                  role="status"
                >
                  Maximum depth reached. Cannot add more nested items.
                </div>
              )}
            </div>
          )}

          {/* Label */}
          <div className="col-span-12">
            <div className="space-y-2">
              <Label htmlFor="menu-label">Label</Label>
              <Input
                id="menu-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Menu Item Label"
                className={errors.label ? 'border-destructive' : ''}
              />
              {errors.label && (
                <p className="text-xs text-destructive">{errors.label}</p>
              )}
            </div>
          </div>

          {/* URL - Show for link and custom types */}
          {(formData.type === 'link' || formData.type === 'custom') && (
            <div className="md:col-span-6">
              <div className="space-y-2">
                <Label htmlFor="menu-url">URL</Label>
                <Input
                  id="menu-url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/page or https://example.com"
                  className={errors.url ? 'border-destructive' : ''}
                />
                {errors.url ? (
                  <p className="text-xs text-destructive">{errors.url}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Enter relative path or full URL</p>
                )}
              </div>
            </div>
          )}

          {/* Target - Show for link types */}
          {formData.type === 'link' && (
            <div className="md:col-span-6">
              <div className="space-y-2">
                <Label htmlFor="menu-target">Open In</Label>
                <Select
                  value={formData.target}
                  onValueChange={(v) =>
                    setFormData({ ...formData, target: v as CreateMenuItemRequest['target'] })
                  }
                >
                  <SelectTrigger id="menu-target">
                    <SelectValue placeholder="Open In" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Page Selection - Show for page type */}
          {formData.type === 'page' && (
            <div className="col-span-12">
              <div
                className="mb-3 rounded-md border border-primary/20 bg-primary-soft px-3 py-2 text-sm dark:border-primary/50 dark:bg-primary/40"
                role="status"
              >
                Page selection will be integrated with your pages API. For now, use custom link type.
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-page-url">Page URL</Label>
                <Input
                  id="menu-page-url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/page-slug"
                />
                <p className="text-xs text-muted-foreground">Enter the page slug or URL</p>
              </div>
            </div>
          )}

          {/* Category Selection - Show for category type */}
          {formData.type === 'category' && (
            <div className="col-span-12">
              <div
                className="mb-3 rounded-md border border-primary/20 bg-primary-soft px-3 py-2 text-sm dark:border-primary/50 dark:bg-primary/40"
                role="status"
              >
                Category selection will be integrated with your categories API. For now, use custom link type.
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-cat-url">Category URL</Label>
                <Input
                  id="menu-cat-url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/category-slug"
                />
                <p className="text-xs text-muted-foreground">Enter the category slug or URL</p>
              </div>
            </div>
          )}

          {/* Icon */}
          <div className="md:col-span-6">
            <div className="space-y-2">
              <Label htmlFor="menu-icon">Icon (Optional)</Label>
              <Input
                id="menu-icon"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="home, settings, etc."
              />
              <p className="text-xs text-muted-foreground">Icon name or custom class</p>
            </div>
          </div>

          {/* CSS Class */}
          <div className="md:col-span-6">
            <div className="space-y-2">
              <Label htmlFor="menu-css">CSS Class (Optional)</Label>
              <Input
                id="menu-css"
                value={formData.cssClass || ''}
                onChange={(e) => setFormData({ ...formData, cssClass: e.target.value })}
                placeholder="custom-class"
              />
              <p className="text-xs text-muted-foreground">Additional CSS classes</p>
            </div>
          </div>

          {/* Order */}
          <div className="md:col-span-6">
            <div className="space-y-2">
              <Label htmlFor="menu-order">Order</Label>
              <Input
                id="menu-order"
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 md:col-span-6">
            <Switch
              id="menu-active"
              checked={formData.isActive}
              onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
            />
            <Label htmlFor="menu-active">Active</Label>
          </div>

          {/* Divider Note */}
          {formData.type === 'divider' && (
            <div className="col-span-12">
              <div
                className="rounded-md border border-primary/20 bg-primary-soft px-3 py-2 text-sm dark:border-primary/50 dark:bg-primary/40"
                role="status"
              >
                Divider items are visual separators and don&apos;t require a label or URL.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting} loading={isSubmitting}>
            {menuItem ? 'Update' : 'Add'} Menu Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
