import { useCallback, useMemo } from 'react'
import {
  getAllowedNextStatuses,
  getEngagementStatusKeys,
  getEngagementStatusLabel,
  getEngagementStatuses,
  getPrimaryEngagementType,
} from '../lib/verticalEngagement'
import {
  buildBookingStatusUiMap,
  engagementEntityLabel,
  getBookingStatusUiEntry,
  listSelectableBookingStatuses,
} from '../lib/engagementStatusUi'
import { useVerticalPack } from './useVerticalPack'

/**
 * Vertical-aware engagement (booking / reservation) labels and status metadata
 * for admin booking flows.
 */
export function useEngagementStatus() {
  const { verticalKey, pack } = useVerticalPack()

  const statuses = useMemo(() => getEngagementStatuses(verticalKey), [verticalKey])
  const statusKeys = useMemo(() => getEngagementStatusKeys(verticalKey), [verticalKey])
  const statusUiMap = useMemo(() => buildBookingStatusUiMap(verticalKey), [verticalKey])
  const entityLabel = useMemo(() => engagementEntityLabel(verticalKey), [verticalKey])
  const primaryType = useMemo(() => getPrimaryEngagementType(verticalKey), [verticalKey])

  const labelFor = useCallback(
    (statusKey: string) => getEngagementStatusLabel(verticalKey, statusKey),
    [verticalKey],
  )

  const allowedNext = useCallback(
    (currentStatus: string) => getAllowedNextStatuses(verticalKey, currentStatus),
    [verticalKey],
  )

  const selectableStatuses = useCallback(
    (currentStatus: string) => listSelectableBookingStatuses(verticalKey, currentStatus),
    [verticalKey],
  )

  const uiFor = useCallback(
    (statusKey: string) => getBookingStatusUiEntry(verticalKey, statusKey),
    [verticalKey],
  )

  return {
    verticalKey,
    pack,
    statuses,
    statusKeys,
    statusUiMap,
    entityLabel,
    primaryType,
    labelFor,
    allowedNext,
    selectableStatuses,
    uiFor,
  }
}
