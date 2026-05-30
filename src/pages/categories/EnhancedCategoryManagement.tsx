import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  Plus,
  RefreshCw,
  TrendingUp,
  FolderTree,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Category } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import EnhancedCategoryList from '../../components/categories/EnhancedCategoryList'
import EnhancedCategoryForm from '../../components/categories/EnhancedCategoryForm'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui'
import { toast } from '../../components/ui/use-toast'

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

const statAccent = {
  primary: 'text-primary',
  success: 'text-storm-deep dark:text-storm-sea',
  info: 'text-primary dark:text-primary',
  warning: 'text-bloom-coral dark:text-bloom-coral',
} as const

const statIconBg = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-storm-deep/10 text-storm-deep dark:text-storm-sea',
  info: 'bg-primary/10 text-primary dark:text-primary',
  warning: 'bg-bloom-coral/10 text-bloom-coral dark:text-bloom-coral',
} as const

export default function EnhancedCategoryManagement() {
  const navigate = useNavigate()

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

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await CategoriesService.getCategories({ limit: 100 })
      const allCategories = response.data.categories
      setCategories(allCategories)

      const newStats: CategoryStats = {
        totalCategories: allCategories.length,
        activeCategories: allCategories.filter((c) => c.isActive).length,
        inactiveCategories: allCategories.filter((c) => !c.isActive).length,
        serviceCategories: allCategories.filter((c) => c.type === 'service').length,
        productCategories: allCategories.filter((c) => c.type === 'product').length,
        bothCategories: allCategories.filter((c) => c.type === 'both').length,
        rootCategories: allCategories.filter((c) => c.level === 0).length,
        subcategories: allCategories.filter((c) => c.level > 0).length,
        totalViews: allCategories.reduce((sum, c) => sum + c.viewCount, 0),
        totalClicks: allCategories.reduce((sum, c) => sum + c.clickCount, 0),
      }
      setStats(newStats)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

  const handleCategoryFormSuccess = (_category: Category) => {
    const wasEdit = editingCategory !== null
    setShowCategoryForm(false)
    setEditingCategory(null)
    loadData()
    toast({
      title: wasEdit ? 'Category updated successfully' : 'Category created successfully',
    })
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    try {
      const response = await CategoriesService.deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      loadData()
      toast({
        title: response.message || 'Category deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const renderStatsCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    accent: keyof typeof statAccent
  ) => (
    <Card
      className={cn(
        'border-border/60 bg-gradient-to-br from-background/95 to-primary/[0.02]',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <CardContent className="p-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cn('text-3xl font-bold tabular-nums', statAccent[accent])}>
              {value.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          <div className={cn('rounded-xl p-3', statIconBg[accent])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.04] shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
                <ol className="flex flex-wrap items-center gap-1.5">
                  <li>
                    <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
                      <Home className="h-4 w-4" aria-hidden />
                      Home
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li className="text-foreground">Category Management</li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Enhanced Category Management</h1>
              <p className="mt-1 text-muted-foreground">
                Manage categories with advanced hierarchy, SEO, and analytics features
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => loadData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button type="button" onClick={handleCreateCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {renderStatsCard('Total Categories', stats.totalCategories, <FolderTree className="h-6 w-6" />, 'primary')}
            {renderStatsCard(
              'Active Categories',
              stats.activeCategories,
              <TrendingUp className="h-6 w-6" />,
              'success'
            )}
            {renderStatsCard('Root Categories', stats.rootCategories, <FolderTree className="h-6 w-6" />, 'info')}
            {renderStatsCard('Total Views', stats.totalViews, <TrendingUp className="h-6 w-6" />, 'warning')}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Category Type Breakdown</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/40 px-3 py-1">
              Services: {stats.serviceCategories}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Products: {stats.productCategories}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Both: {stats.bothCategories}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <EnhancedCategoryList
        onCategoryEdit={handleEditCategory}
        onCategoryDelete={handleDeleteCategory}
        onCategoryCreate={handleCreateCategory}
        showStats={true}
      />

      <EnhancedCategoryForm
        open={showCategoryForm}
        onClose={handleCategoryFormClose}
        category={editingCategory}
        parentCategories={categories.filter((c) => c.level < 3)}
        onSuccess={handleCategoryFormSuccess}
      />

      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {deletingCategory
                ? `Are you sure you want to delete "${deletingCategory.name}"? Products and services in this category will be moved to another category. Nested categories are kept and moved up one level in the tree. This cannot be undone.`
                : null}
            </p>
            {deletingCategory && deletingCategory.childrenCount > 0 && (
              <div
                role="status"
                className="flex gap-2 rounded-md border border-bloom-coral/40 bg-bloom-coral/10 px-3 py-2 text-bloom-coral dark:text-bloom-deep"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  This category has {deletingCategory.childrenCount} nested categories. They will be reparented, not
                  removed.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
