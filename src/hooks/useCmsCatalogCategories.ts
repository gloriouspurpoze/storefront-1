import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoriesService } from '../services/api/categories.service'
import type { Category } from '../types'
import {
  CMS_DEFAULT_FALLBACK_SLUG,
  buildCmsCatalogOptionsFromCategories,
} from '../constants/cmsCatalogCategories'

export type UseCmsCatalogCategoriesResult = {
  options: ReturnType<typeof buildCmsCatalogOptionsFromCategories>
  loading: boolean
  /** First catalog slug from API (plus synthetic entries), for defaulting pickers */
  defaultSlug: string
  getLabel: (slug: string) => string
}

/**
 * CMS keys (rate card, category marketing, cross-linking) use the same slug as root **service** categories
 * in Categories admin. Hyperlocal records use `{industrySlug}__{localitySlug}` with exactly `__` between parts.
 */
export function useCmsCatalogCategories(): UseCmsCatalogCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await CategoriesService.getCategoriesForServiceUIs({
          page: 1,
          limit: 500,
          is_active: true,
        })
        if (!cancelled) setCategories(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => buildCmsCatalogOptionsFromCategories(categories), [categories])

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of options) {
      m.set(o.value, o.label)
    }
    return m
  }, [options])

  const getLabel = useCallback(
    (slug: string) => labelBySlug.get(slug) ?? slug,
    [labelBySlug],
  )

  const defaultSlug = options[0]?.value ?? CMS_DEFAULT_FALLBACK_SLUG

  return { options, loading, defaultSlug, getLabel }
}
