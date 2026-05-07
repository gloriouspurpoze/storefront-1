import React, { useState, useEffect } from 'react'
import { Card, Button, VStack, HStack, useToast } from '../../components/ui'
import { ProductTable } from '../../components/products/ProductTable'
import { ProductGrid } from '../../components/products/ProductGrid'
import { PageHeader } from '../../components/common/PageHeader'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { ProductsService } from '../../services/api/products.service'
import { CategoriesService } from '../../services/api/categories.service'
import { Product } from '../../types'
import { toProductImageEmbedsForApi } from '../../lib/productFormPayload'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Fetch products when status filter changes
  useEffect(() => {
    fetchProducts()
  }, [statusFilter])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const query: any = {
        page: 1,
        limit: 100,
      }
      
      // Add status filter if not 'all'
      if (statusFilter === 'active') {
        query.is_active = true
      } else if (statusFilter === 'inactive') {
        query.is_active = false
      }
      
      console.log('📦 [Products] Fetching with query:', query)
      
      const response = await ProductsService.getProducts(query)
      if (response.success && response.data) {
        setProducts(response.data.products || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const list = await CategoriesService.getCategoriesForProductUIs({ page: 1, limit: 200 })
      setCategories(list)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const response = await ProductsService.updateProduct(updatedProduct.id.toString(), {
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        original_price: updatedProduct.original_price,
        sku: updatedProduct.sku,
        stock_quantity: updatedProduct.stock_quantity,
        images: toProductImageEmbedsForApi(updatedProduct.images as unknown, updatedProduct.name),
        is_active: updatedProduct.is_active,
        is_featured: updatedProduct.is_featured,
      })
      
      if (response.success) {
        await fetchProducts()
        dispatch(addToast({
          message: 'Product updated successfully!',
          severity: 'success',
          duration: 4000,
        }))
      }
    } catch (error) {
      console.error('Error updating product:', error)
      dispatch(addToast({
        message: 'Failed to update product.',
        severity: 'error',
        duration: 4000,
      }))
    }
  }

  const handleDeleteProduct = async (productId: number | string) => {
    try {
      const response = await ProductsService.deleteProduct(productId.toString())
      
      if (response.success) {
        await fetchProducts()
        dispatch(addToast({
          message: 'Product deleted successfully!',
          severity: 'success',
          duration: 4000,
        }))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      dispatch(addToast({
        message: 'Failed to delete product.',
        severity: 'error',
        duration: 4000,
      }))
    }
  }

  const handleAddProduct = () => {
    navigate('/products/add')
  }

  const handleViewProduct = (product: Product) => {
    navigate(`/products/view/${product.id}`)
  }

  const activeCount = products.filter(p => p.is_active).length
  const inactiveCount = products.filter(p => !p.is_active).length

  return (
    <div className="p-6">
      <VStack spacing={6}>
        {/* Header with Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <PageHeader
              title="Products"
              subtitle="Manage your product catalog and inventory"
            />
          </div>

          <HStack spacing={3} className="flex-wrap">
            {/* Status Filter */}
            <div className="flex rounded-lg border bg-background">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="flex items-center gap-2">
                  All
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                    {products.length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  statusFilter === 'active'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="flex items-center gap-2">
                  Active
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                    {activeCount}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors border-l ${
                  statusFilter === 'inactive'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="flex items-center gap-2">
                  Drafts
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                    {inactiveCount}
                  </span>
                </span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border bg-background">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors border-l ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                Grid View
              </button>
            </div>
          </HStack>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {viewMode === 'table' ? (
              <ProductTable
                products={products}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onAdd={handleAddProduct}
                onView={handleViewProduct}
                categories={categories}
              />
            ) : (
              <ProductGrid
                products={products}
                categories={categories}
                onView={handleViewProduct}
                onDelete={handleDeleteProduct}
                onAdd={handleAddProduct}
              />
            )}
          </>
        )}
      </VStack>
    </div>
  )
}
