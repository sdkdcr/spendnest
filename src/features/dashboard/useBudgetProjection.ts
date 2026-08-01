import { useMemo } from 'react'
import type { SpendPlan } from '../../shared/domain/types'
import { buildMonthRange } from '../../shared/domain/month-key'
import { resolveBudgetForMonth } from '../spends/budget-resolution'
import { PROJECTION_MONTHS_BACK, PROJECTION_MONTHS_FORWARD } from './projection.constants'
import type { ProjectionPoint } from './BudgetProjectionChart'

export function useBudgetProjection(
  plans: SpendPlan[],
  selectedMonthKey: string,
): ProjectionPoint[] {
  return useMemo(() => {
    const monthRange = buildMonthRange(
      selectedMonthKey,
      PROJECTION_MONTHS_BACK,
      PROJECTION_MONTHS_FORWARD,
    )

    return monthRange.map((monthKey) => {
      const total = plans.reduce((sum, plan) => {
        const amount = resolveBudgetForMonth(plan, monthKey)
        return amount === undefined ? sum : sum + amount
      }, 0)

      return { monthKey, total }
    })
  }, [plans, selectedMonthKey])
}
