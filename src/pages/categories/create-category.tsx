import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ArrowLeft,
  ImageIcon,
  FolderTree,
  Save,
  Loader2,
} from 'lucide-react'
import { CategoriesService } from '../../services/api/categories.service'
import { ImageUploadField, type ImageFile } from '../../components/forms'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '../../components/ui'

interface CategoryFormData {
  name: string
  description: string
  categoryType: 'service' | 'product' | 'both'
  images: ImageFile[]
  sortOrder: number
  isActive: boolean
}

function appliesToMenuOptions(
  listScope: 'products' | 'services' | null
): { value: CategoryFormData['categoryType']; label: string }[] {
  if (!listScope) {
    return [
      { value: 'product', label: 'Store products only' },
      { value: 'service', label: 'Services only' },
      { value: 'both', label: 'Both (products & services)' },
    ]
  }
  if (listScope === 'products') {
    return [
      { value: 'product', label: 'Store products only' },
      { value: 'both', label: 'Both (also show under services)' },
    ]
  }
  return [
    { value: 'service', label: 'Services only' },
    { value: 'both', label: 'Both (also show in the product store)' },
  ]
}

function normalizeCategoryTypeForScope(
  value: string,
  listScope: 'products' | 'services' | null
): CategoryFormData['categoryType'] {
  const allowed = appliesToMenuOptions(listScope).map((o) => o.value)
  if (allowed.includes(value as CategoryFormData['categoryType'])) {
    return value as CategoryFormData['categoryType']
  }
  return allowed[0] ?? 'product'
}

export function CreateCategory() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { scope: pathScope, id } = useParams<{ scope?: string; id: string }>()

  const listScope = pathScope === 'products' || pathScope === 'services' ? pathScope : null
  const backPath = listScope ? `/categories/${listScope}` : '/categories'
  const catalogLabel =
    listScope === 'products' ? 'product catalog' : listScope === 'services' ? 'service catalog' : 'catalogs'

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    categoryType: 'product',
    images: [],
    sortOrder: 0,
    isActive: true,
  })

  const isEditMode = location.pathname.includes('/edit/')
  const isViewMode = location.pathname.includes('/view/')
  const isCreateMode = !isEditMode && !isViewMode

  useEffect(() => {
    if (!isCreateMode || !listScope) return
    setFormData((prev) => ({
      ...prev,
      categoryType: listScope === 'products' ? 'product' : 'service',
    }))
  }, [isCreateMode, listScope])

  useEffect(() => {
    setFormData((prev) => {
      const next = normalizeCategoryTypeForScope(prev.categoryType, listScope)
      if (next === prev.categoryType) return prev
      return { ...prev, categoryType: next }
    })
  }, [listScope])

  const fetchCategoryData = useCallback(async (categoryId: string) => {
    if (!categoryId?.trim()) return
    try {
      setLoadingData(true)
      const response = await CategoriesService.getCategory(categoryId)
      const raw = response?.data
      const category = raw && typeof raw === 'object' && 'name' in raw
        ? raw
        : (raw as any)?.category ?? (raw as any)?.data ?? null

      if (category && (category.name != null || category.description != null)) {
        const isActive =
          category.isActive !== undefined
            ? Boolean(category.isActive)
            : (category as any).is_active !== undefined
              ? Boolean((category as any).is_active)
              : category.status === 'active'
        const sortOrder = category.sortOrder ?? (category as any).sort_order ?? 0
        const rawType =
          category.type || category.categoryType || (category as any).category_type || 'product'
        const categoryType = normalizeCategoryTypeForScope(String(rawType), listScope)
        const imageUrl = category.image ?? (category as any).icon ?? (category as any).featuredImage

        setFormData({
          name: category.name || '',
          description: category.description || '',
          categoryType,
          images: imageUrl
            ? [
                {
                  id: '1',
                  url: imageUrl,
                  file: undefined,
                  alt: category.name,
                  isPrimary: true,
                  order: 0,
                },
              ]
            : [],
          sortOrder: Number(sortOrder) || 0,
          isActive,
        })
      } else if (response?.success && isEditMode) {
        dispatch(
          addToast({
            message: 'Category data could not be loaded. Please try again.',
            severity: 'warning',
            duration: 4000,
          })
        )
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      dispatch(
        addToast({
          message: 'Failed to load category data.',
          severity: 'error',
          duration: 4000,
        })
      )
    } finally {
      setLoadingData(false)
    }
  }, [dispatch, isEditMode, listScope])

  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      void fetchCategoryData(id)
    }
  }, [id, isEditMode, isViewMode, fetchCategoryData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        categoryType: formData.categoryType,
        image: formData.images.length > 0 ? formData.images[0].url : undefined,
        sortOrder: formData.sortOrder,
        status: formData.isActive ? ('active' as const) : ('inactive' as const),
      }

      console.log('📤 Submitting category data:', categoryData)
      console.log('📝 Category Type being sent:', formData.categoryType)

      let response
      if (isEditMode && id) {
        response = await CategoriesService.updateCategory(id, categoryData)
      } else {
        response = await CategoriesService.createCategory(categoryData)
      }

      if (response.success) {
        dispatch(
          addToast({
            message: isEditMode ? 'Category updated successfully!' : 'Category created successfully!',
            severity: 'success',
            duration: 4000,
          })
        )

        navigate(backPath)
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error)
      dispatch(
        addToast({
          message: `Failed to ${isEditMode ? 'update' : 'create'} category.`,
          severity: 'error',
          duration: 4000,
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex-1 bg-muted/40">
      <div className="mb-6 bg-gradient-to-br from-primary to-primary-deep text-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/15"
              onClick={() => navigate(backPath)}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isViewMode
                  ? 'View category'
                  : isEditMode
                    ? 'Edit category'
                    : listScope === 'products'
                      ? 'New product category'
                      : listScope === 'services'
                        ? 'New service category'
                        : 'New category'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-white/90">
                {listScope
                  ? isViewMode || isEditMode
                    ? `Changes apply to the ${catalogLabel} list.`
                    : `This category is created under the ${catalogLabel} screen. You can set whether it is product-only, service-only, or both.`
                  : isViewMode
                    ? 'Category details and information'
                    : isEditMode
                      ? 'Update category information'
                      : 'Add a category to organize the catalog'}
              </p>
            </div>
            <FolderTree className="hidden h-14 w-14 shrink-0 opacity-20 sm:block" aria-hidden />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        {loadingData ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <span className="sr-only">Loading</span>
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {listScope && !isViewMode && (
                  <div
                    role="status"
                    className="rounded-md border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary dark:border-primary dark:bg-primary/40 dark:text-primary-deep"
                  >
                    {listScope === 'products'
                      ? 'You are on the product categories flow. “Both” is available if a category should also be used for services.'
                      : 'You are on the service categories flow. “Both” is available if a category should also be used in the product store.'}
                  </div>
                )}

                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                    <FolderTree className="h-5 w-5" aria-hidden />
                    Basic Information
                  </h2>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category-name">Category Name *</Label>
                      <Input
                        id="category-name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Electronics, Home Appliances, Plumbing"
                        disabled={isViewMode}
                      />
                      <p className="text-xs text-muted-foreground">Enter a clear, descriptive category name</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="category-desc">Description</Label>
                      <Textarea
                        id="category-desc"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the category and what products/services it includes..."
                        disabled={isViewMode}
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a brief description to help users understand this category
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="applies-to">Applies to</Label>
                      <Select
                        value={formData.categoryType}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            categoryType: v as CategoryFormData['categoryType'],
                          })
                        }
                        disabled={isViewMode}
                      >
                        <SelectTrigger id="applies-to" className="w-full">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          {appliesToMenuOptions(listScope).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <Separator />

                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                    <ImageIcon className="h-5 w-5" aria-hidden />
                    Category Image
                  </h2>
                  <ImageUploadField
                    label="Upload Category Image"
                    value={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    maxFiles={1}
                    maxSize={5}
                    helperText="Upload a category image. Recommended size: 400x400px (1:1 ratio). Max file size: 5MB"
                    disabled={isViewMode}
                  />
                </section>

                <Separator />

                <section>
                  <h2 className="mb-4 text-lg font-semibold">Settings</h2>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sort-order">Sort Order</Label>
                      <Input
                        id="sort-order"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                        }
                        disabled={isViewMode}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower numbers appear first in the list (e.g., 1, 2, 3…)
                      </p>
                    </div>

                    <div
                      className={cn(
                        'flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4'
                      )}
                    >
                      <div>
                        <Label htmlFor="active-category" className="text-base font-medium">
                          Active Category
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Inactive categories won&apos;t be visible to users
                        </p>
                      </div>
                      <Switch
                        id="active-category"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </section>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(backPath)}
                    disabled={loading}
                  >
                    {isViewMode ? 'Back' : 'Cancel'}
                  </Button>
                  {!isViewMode && (
                    <Button
                      type="submit"
                      disabled={loading || !formData.name}
                      loading={loading}
                      leftIcon={
                        loading ? undefined : isEditMode ? (
                          <Save className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )
                      }
                      className="min-w-[160px]"
                    >
                      {loading
                        ? isEditMode
                          ? 'Updating…'
                          : 'Creating…'
                        : isEditMode
                          ? 'Update Category'
                          : 'Create Category'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CreateCategory
