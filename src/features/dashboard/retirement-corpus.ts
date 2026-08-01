import type { Category, SpendPlan } from '../../shared/domain/types'
import { resolveBudgetForMonth } from '../spends/budget-resolution'

const MONTHS_PER_YEAR = 12

export interface RetirementCategoryProjection {
  categoryId: number
  categoryName: string
  color: string
  currentBalance: number
  monthlyContribution: number
  projectedBalance: number
}

function projectCategoryBalance(
  currentBalance: number,
  monthlyContribution: number,
  annualGrowthRatePercent: number,
  years: number,
): number {
  const growthMultiplier = 1 + annualGrowthRatePercent / 100
  let balance = currentBalance

  for (let year = 0; year < years; year += 1) {
    balance = (balance + MONTHS_PER_YEAR * monthlyContribution) * growthMultiplier
  }

  return balance
}

export function projectRetirementCorpus(
  categories: Category[],
  plans: SpendPlan[],
  currentMonthKey: string,
  years: number,
): RetirementCategoryProjection[] {
  const tagged = categories.filter((category) => category.isRetirementCorpus)

  return tagged
    .filter((category) => category.id !== undefined)
    .map((category) => {
      const categoryId = category.id as number
      const monthlyContribution = plans
        .filter((plan) => plan.categoryId === categoryId)
        .reduce((sum, plan) => sum + (resolveBudgetForMonth(plan, currentMonthKey) ?? 0), 0)

      const currentBalance = category.retirementCurrentBalance ?? 0
      const annualGrowthRatePercent = category.retirementAnnualGrowthRatePercent ?? 0

      const projectedBalance =
        years === 0
          ? currentBalance
          : projectCategoryBalance(currentBalance, monthlyContribution, annualGrowthRatePercent, years)

      return {
        categoryId,
        categoryName: category.name,
        color: category.color,
        currentBalance,
        monthlyContribution,
        projectedBalance,
      }
    })
}
