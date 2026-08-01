import type { SpendPlan } from '../../shared/domain/types'
import { resolveBudgetForMonth } from '../spends/budget-resolution'

export interface ResolvedPlan {
  planId: number
  personId?: number
  type: string
  name: string
  quantity: string
  dayOfDeduction?: number
  amount: number
}

export function resolvePlansForMonth(plans: SpendPlan[], monthKey: string): ResolvedPlan[] {
  const resolved: ResolvedPlan[] = []

  for (const plan of plans) {
    if (plan.id === undefined) {
      continue
    }

    const amount = resolveBudgetForMonth(plan, monthKey)
    if (amount === undefined) {
      continue
    }

    resolved.push({
      planId: plan.id,
      personId: plan.personId,
      type: plan.type,
      name: plan.name,
      quantity: plan.quantity,
      dayOfDeduction: plan.dayOfDeduction,
      amount,
    })
  }

  return resolved
}
