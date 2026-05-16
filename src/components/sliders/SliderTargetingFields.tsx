import React, { useEffect, useState } from 'react'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Loader2 } from 'lucide-react'
import {
  PRODUCT_PLACEMENTS,
  SERVICE_CATEGORY_PLACEMENTS,
  STORE_CATEGORY_PLACEMENTS,
  type SliderPlacement,
} from '../../types'
import { CategoriesService } from '../../services/api/categories.service'
import { ProductsService } from '../../services/api/products.service'

type CategoryOption = { id: string; name: string; slug?: string }

interface SliderTargetingFieldsProps {
  placement: SliderPlacement
  categoryId: string
  onCategoryIdChange: (id: string, meta?: { slug?: string; name?: string }) => void
  productId: string
  productSlug: string
  productName: string
  onProductChange: (patch: { productId: string; productSlug: string; productName: string }) => void
  buttonUrl: string
  onButtonUrlChange: (url: string) => void
}

export function SliderTargetingFields({
  placement,
  categoryId,
  onCategoryIdChange,
  productId,
  productSlug,
  productName,
  onProductChange,
  buttonUrl,
  onButtonUrlChange,
}: SliderTargetingFieldsProps) {
  const [serviceCategories, setServiceCategories] = useState<CategoryOption[]>([])
  const [storeCategories, setStoreCategories] = useState<CategoryOption[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<
    { id: string; name: string; slug?: string }[]
  >([])
  const [productLoading, setProductLoading] = useState(false)

  const needsServiceCategory = SERVICE_CATEGORY_PLACEMENTS.includes(placement)
  const needsStoreCategory = STORE_CATEGORY_PLACEMENTS.includes(placement)
  const needsProduct = PRODUCT_PLACEMENTS.includes(placement)

  useEffect(() => {
    if (!needsServiceCategory) return
    CategoriesService.getServiceCategories()
      .then((res) => {
        const list = (res?.data ?? []) as CategoryOption[]
        setServiceCategories(Array.isArray(list) ? list : [])
      })
      .catch(() => setServiceCategories([]))
  }, [needsServiceCategory])

  useEffect(() => {
    if (!needsStoreCategory) return
    CategoriesService.getProductCategories()
      .then((res) => {
        const list = (res?.data ?? []) as CategoryOption[]
        setStoreCategories(Array.isArray(list) ? list : [])
      })
      .catch(() => setStoreCategories([]))
  }, [needsStoreCategory])

  useEffect(() => {
    if (!needsProduct) return
    const controller = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        setProductLoading(true)
        const res = await ProductsService.getProducts({
          page: 1,
          limit: 12,
          search: productSearch.trim() || undefined,
        })
        const items = (res?.data?.products ?? res?.data ?? []) as {
          id?: string
          _id?: string
          name?: string
          slug?: string
        }[]
        setProductOptions(
          (Array.isArray(items) ? items : []).map((p) => ({
            id: String(p.id || p._id),
            name: String(p.name || 'Product'),
            slug: p.slug ? String(p.slug) : undefined,
          })),
        )
      } catch {
        setProductOptions([])
      } finally {
        setProductLoading(false)
      }
    }, 350)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [needsProduct, productSearch])

  if (!needsServiceCategory && !needsStoreCategory && !needsProduct) {
    if (placement === 'store_home') {
      return (
        <p className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Shown on the store landing page (<code className="text-[11px]">/store</code>). No aisle or
          product filter — use Call to Action to link a collection or product.
        </p>
      )
    }
    return null
  }

  const categoryList = needsStoreCategory ? storeCategories : serviceCategories
  const categoryLabel = needsStoreCategory ? 'Store aisle (product category)' : 'Service category'

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      {(needsServiceCategory || needsStoreCategory) && (
        <div className="space-y-2">
          <Label>{categoryLabel}</Label>
          <Select
            value={categoryId || '__all__'}
            onValueChange={(v) => {
              if (v === '__all__') {
                onCategoryIdChange('')
                return
              }
              const cat = categoryList.find((c) => c.id === v)
              onCategoryIdChange(v, { slug: cat?.slug, name: cat?.name })
            }}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder={needsStoreCategory ? 'All store aisles' : 'All categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {needsStoreCategory ? 'All store aisles (not recommended)' : 'All categories'}
              </SelectItem>
              {categoryList.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                  {cat.slug ? ` (${cat.slug})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {needsStoreCategory
              ? 'Matches /store/[aisle-slug] on the website. Leave empty only for site-wide store promos on Store Home placement.'
              : 'Matches service catalog pages for that trade (e.g. AC, plumber).'}
          </p>
        </div>
      )}

      {needsProduct && (
        <>
          <div className="space-y-2">
            <Label htmlFor="slider-product-search">Product</Label>
            <div className="relative">
              <Input
                id="slider-product-search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by product name…"
                className="rounded-lg pr-9"
              />
              {productLoading ? (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <Select
              value={productId || '__none__'}
              onValueChange={(v) => {
                if (v === '__none__') {
                  onProductChange({ productId: '', productSlug: '', productName: '' })
                  return
                }
                const picked = productOptions.find((p) => p.id === v)
                const slug = picked?.slug || ''
                onProductChange({
                  productId: v,
                  productSlug: slug,
                  productName: picked?.name || '',
                })
                if (slug && !buttonUrl.trim()) {
                  onButtonUrlChange(`/store/product/${slug}`)
                }
              }}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select a product</SelectItem>
                {productId && productName && !productOptions.some((p) => p.id === productId) ? (
                  <SelectItem value={productId}>{productName}</SelectItem>
                ) : null}
                {productOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.slug ? ` · ${p.slug}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productSlug ? (
              <p className="text-xs text-muted-foreground">
                PDP: <code className="text-[11px]">/store/product/{productSlug}</code>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Hero appears on that product&apos;s detail page when placement is Product Page Promo.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
