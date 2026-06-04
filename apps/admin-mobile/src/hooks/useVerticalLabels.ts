import { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { verticalLabels, type VerticalLabels } from '@/lib/verticalLabels'

/**
 * Industry-aware copy for the current tenant. Reads `tenant.verticalKey` from the
 * logged-in user (serialized by the backend `sanitizeUser`) and falls back to the
 * home-services defaults when absent.
 */
export function useVerticalLabels(): VerticalLabels {
  const verticalKey = useAppSelector((s) => s.auth.user?.tenant?.verticalKey)
  return useMemo(() => verticalLabels(verticalKey), [verticalKey])
}
