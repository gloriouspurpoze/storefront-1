import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import { getVerticalPack } from '../verticals/registry'
import { DEFAULT_VERTICAL_KEY, normalizeVerticalKey } from '../verticals/core/types'
import type { VerticalPackDefinition } from '../verticals/core/types'

export function useVerticalPack(): {
  verticalKey: ReturnType<typeof normalizeVerticalKey>
  pack: VerticalPackDefinition
} {
  const verticalKey = useAppSelector((s) => normalizeVerticalKey(s.tenant?.verticalKey ?? DEFAULT_VERTICAL_KEY))

  const pack = useMemo(() => getVerticalPack(verticalKey), [verticalKey])

  return { verticalKey, pack }
}
