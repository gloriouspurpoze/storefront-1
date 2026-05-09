import { useCallback, useEffect, useState } from 'react'
import { CMSService } from '../services/api'

export type ServiceCatalogLocalityRow = {
  _id: string
  slug: string
  name: string
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export function useServiceCatalogLocalities() {
  const [rows, setRows] = useState<ServiceCatalogLocalityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CMSService.listServiceCatalogLocalities()
      setRows(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load localities'
      setError(msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { rows, loading, error, refresh }
}
