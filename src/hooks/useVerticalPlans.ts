import { useCallback, useMemo } from 'react'
import {
  getBillingPlansForVertical,
  getDefaultPlanKey,
  getPlanForVertical,
  getRecommendedPlan,
  planLabelFor,
} from '../lib/verticalPlans'
import { useVerticalPack } from './useVerticalPack'

export function useVerticalPlans() {
  const { verticalKey, pack } = useVerticalPack()

  const plans = useMemo(() => getBillingPlansForVertical(verticalKey), [verticalKey])
  const recommended = useMemo(() => getRecommendedPlan(verticalKey), [verticalKey])
  const defaultPlanKey = useMemo(() => getDefaultPlanKey(verticalKey), [verticalKey])

  const planFor = useCallback(
    (planKey: string | null | undefined) => getPlanForVertical(verticalKey, planKey),
    [verticalKey],
  )

  const labelFor = useCallback(
    (planKey: string | null | undefined) => planLabelFor(verticalKey, planKey),
    [verticalKey],
  )

  return {
    verticalKey,
    pack,
    plans,
    recommended,
    defaultPlanKey,
    planFor,
    labelFor,
  }
}
