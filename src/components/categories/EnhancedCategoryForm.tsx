import React, { useState, useEffect } from 'react'
import {
  FolderTree,
  Save,
  X,
  Search,
  Settings2,
  Eye,
  Palette,
  TrendingUp,
  ImageIcon,
} from 'lucide-react'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import { cn } from '../../lib/utils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Separator,
} from '../ui'

interface EnhancedCategoryFormProps {
  open: boolean
  onClose: () => void
  category?: Category | null
  parentCategories?: Category[]
  onSuccess?: (category: Category) => void
}

function FormSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mb-2 rounded-lg border border-border/60 bg-muted/30 p-6 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'mb-4 flex items-center gap-2 text-base font-semibold text-primary',
        className
      )}
    >
      {children}
    </h3>
  )
}

function AlertBox({
  variant,
  className,
  children,
}: {
  variant: 'info' | 'error'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        variant === 'info' && 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
        variant === 'error' && 'border-destructive/50 bg-destructive/10 text-destructive',
        className
      )}
    >
      {children}
    </div>
  )
}

const NO_PARENT_VALUE = '__none__'

export default function EnhancedCategoryForm({
  open,
  onClose,
  category,
  parentCategories = [],
  onSuccess,
}: EnhancedCategoryFormProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    status: 'active' as 'active' | 'inactive',
    categoryType: 'both' as 'product' | 'service' | 'both',
    image: '',
    icon: '',
    sortOrder: 0,
    level: 0,
    metaTitle: '',
    metaDescription: '',
    seoKeywords: [] as string[],
    featuredImage: '',
    bannerImage: '',
    colorCode: '',
    viewCount: 0,
    clickCount: 0,
  })

  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId || '',
        status: category.status || 'active',
        categoryType: category.type || 'both',
        image: category.image || '',
        icon: category.icon || '',
        sortOrder: category.sortOrder || 0,
        level: category.level || 0,
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        seoKeywords: category.seoKeywords || [],
        featuredImage: category.featuredImage || '',
        bannerImage: category.bannerImage || '',
        colorCode: category.colorCode || '',
        viewCount: category.viewCount || 0,
        clickCount: category.clickCount || 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: '',
        status: 'active',
        categoryType: 'both',
        image: '',
        icon: '',
        sortOrder: 0,
        level: 0,
        metaTitle: '',
        metaDescription: '',
        seoKeywords: [],
        featuredImage: '',
        bannerImage: '',
        colorCode: '',
        viewCount: 0,
        clickCount: 0,
      })
    }
  }, [category])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.seoKeywords.includes(keywordInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keywordInput.trim()],
      }))
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter((k) => k !== keyword),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }

    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title must be 60 characters or less'
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description must be 160 characters or less'
    }

    if (formData.colorCode && !/^#[0-9A-Fa-f]{6}$/.test(formData.colorCode)) {
      newErrors.colorCode = 'Color code must be a valid hex color (e.g., #FF5733)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const requestData: CreateCategoryRequest | UpdateCategoryRequest = {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || undefined,
        status: formData.status === 'active' ? 'active' : 'inactive',
        categoryType: formData.categoryType,
        image: formData.image,
        icon: formData.icon,
        sortOrder: formData.sortOrder,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        seoKeywords: formData.seoKeywords,
        featuredImage: formData.featuredImage,
        bannerImage: formData.bannerImage,
        colorCode: formData.colorCode,
      }

      let response
      if (category) {
        response = await CategoriesService.updateCategory(category.id, requestData)
      } else {
        response = await CategoriesService.createCategory(requestData)
      }

      onSuccess?.(response.data)
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      setErrors({ submit: 'Failed to save category. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { label: 'Basic Info', icon: FolderTree },
    { label: 'SEO', icon: Search },
    { label: 'Marketing', icon: Palette },
    { label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent
        className={cn(
          'max-h-[95vh] max-w-[1000px] overflow-y-auto border bg-gradient-to-br from-background to-primary/5 p-0 sm:max-w-[1000px]'
        )}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="text-xl">
              {category ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} type="button">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pt-4">
          <Tabs value={String(activeTab)} onValueChange={(v) => setActiveTab(Number(v))}>
            <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
              {tabs.map((tab, index) => (
                <TabsTrigger
                  key={tab.label}
                  value={String(index)}
                  className="gap-1.5 text-xs sm:text-sm"
                >
                  <tab.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="0" className="mt-0">
              <FormSection>
                <SectionTitle>
                  <FolderTree className="h-5 w-5" aria-hidden />
                  Basic Information
                </SectionTitle>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="cat-name">Category Name *</Label>
                      <Input
                        id="cat-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={cn(errors.name && 'border-destructive')}
                        placeholder="Category name"
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label>Category Type</Label>
                      <Select
                        value={formData.categoryType}
                        onValueChange={(v) =>
                          handleInputChange('categoryType', v as typeof formData.categoryType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cat-desc">Description</Label>
                    <Textarea
                      id="cat-desc"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label>Parent Category</Label>
                      <Select
                        value={formData.parentId || NO_PARENT_VALUE}
                        onValueChange={(v) =>
                          handleInputChange('parentId', v === NO_PARENT_VALUE ? '' : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_PARENT_VALUE}>No Parent (Root Category)</SelectItem>
                          {parentCategories.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="sort-order">Sort Order</Label>
                      <Input
                        id="sort-order"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          handleInputChange('sortOrder', parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="image-url">Image URL</Label>
                      <Input
                        id="image-url"
                        value={formData.image}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="icon-field">Icon</Label>
                      <Input
                        id="icon-field"
                        value={formData.icon}
                        onChange={(e) => handleInputChange('icon', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="active-switch"
                      checked={formData.status === 'active'}
                      onCheckedChange={(checked) =>
                        handleInputChange('status', checked ? 'active' : 'inactive')
                      }
                    />
                    <Label htmlFor="active-switch">Active</Label>
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            <TabsContent value="1" className="mt-0">
              <FormSection>
                <SectionTitle>
                  <Search className="h-5 w-5" aria-hidden />
                  SEO Settings
                </SectionTitle>

                <div className="flex flex-col gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input
                      id="meta-title"
                      value={formData.metaTitle}
                      maxLength={60}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      className={cn(errors.metaTitle && 'border-destructive')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {errors.metaTitle ||
                        `${formData.metaTitle.length}/60 characters`}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meta-desc">Meta Description</Label>
                    <Textarea
                      id="meta-desc"
                      rows={3}
                      maxLength={160}
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      className={cn(errors.metaDescription && 'border-destructive')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {errors.metaDescription ||
                        `${formData.metaDescription.length}/160 characters`}
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 block">SEO Keywords</Label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Input
                        className="max-w-md flex-1"
                        placeholder="Add keyword"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddKeyword()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddKeyword}
                        disabled={!keywordInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.seoKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                          {keyword}
                          <button
                            type="button"
                            className="ml-1 rounded-full p-0.5 hover:bg-background/80"
                            onClick={() => handleRemoveKeyword(keyword)}
                            aria-label={`Remove ${keyword}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            <TabsContent value="2" className="mt-0">
              <FormSection>
                <SectionTitle>
                  <Palette className="h-5 w-5" aria-hidden />
                  Marketing & Branding
                </SectionTitle>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="feat-img">Featured Image URL</Label>
                      <Input
                        id="feat-img"
                        value={formData.featuredImage}
                        onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="banner-img">Banner Image URL</Label>
                      <Input
                        id="banner-img"
                        value={formData.bannerImage}
                        onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px] flex-1 space-y-1.5">
                      <Label htmlFor="color-code">Color Code</Label>
                      <Input
                        id="color-code"
                        value={formData.colorCode}
                        onChange={(e) => handleInputChange('colorCode', e.target.value)}
                        placeholder="#FF5733"
                        className={cn(errors.colorCode && 'border-destructive')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {errors.colorCode || 'Hex color code (e.g., #FF5733)'}
                      </p>
                    </div>
                    {formData.colorCode && /^#[0-9A-Fa-f]{6}$/.test(formData.colorCode) && (
                      <div
                        className="h-10 w-[100px] shrink-0 rounded border border-border"
                        style={{ backgroundColor: formData.colorCode }}
                        aria-hidden
                      />
                    )}
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            <TabsContent value="3" className="mt-0">
              <FormSection>
                <SectionTitle>
                  <TrendingUp className="h-5 w-5" aria-hidden />
                  Analytics & Performance
                </SectionTitle>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="view-count">View Count</Label>
                      <Input id="view-count" readOnly value={formData.viewCount} className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Total number of views</p>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="click-count">Click Count</Label>
                      <Input id="click-count" readOnly value={formData.clickCount} className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Total number of clicks</p>
                    </div>
                  </div>

                  <AlertBox variant="info">
                    Analytics data is automatically tracked and cannot be manually edited.
                  </AlertBox>
                </div>
              </FormSection>
            </TabsContent>
          </Tabs>

          {errors.submit && (
            <AlertBox variant="error" className="mt-4">
              {errors.submit}
            </AlertBox>
          )}
        </div>

        <Separator className="mt-4" />

        <DialogFooter className="gap-2 px-6 pb-6 pt-4 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {loading ? 'Saving…' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
