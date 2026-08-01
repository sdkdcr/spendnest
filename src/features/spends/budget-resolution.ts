import type { SpendPlan, StepChange } from '../../shared/domain/types'
import { isPlanEligibleForMonth } from './frequency.rules'

function cycleKey(effectiveDate: string): string {
  return effectiveDate.slice(0, 7)
}

function latestPermanentStepAmount(
  steps: StepChange[],
  monthKey: string,
  baseBudget: number,
): number {
  const permanentSteps = steps
    .filter((step) => !step.oneOff && cycleKey(step.effectiveDate) <= monthKey)
    .sort((a, b) => cycleKey(a.effectiveDate).localeCompare(cycleKey(b.effectiveDate)))

  if (permanentSteps.length === 0) {
    return baseBudget
  }

  return permanentSteps[permanentSteps.length - 1].amount
}

function oneOffStepForMonth(
  steps: StepChange[],
  monthKey: string,
): StepChange | undefined {
  return steps.find((step) => step.oneOff && cycleKey(step.effectiveDate) === monthKey)
}

export function resolveBudgetForMonth(
  plan: SpendPlan,
  monthKey: string,
): number | undefined {
  if (!isPlanEligibleForMonth(plan, monthKey)) {
    return undefined
  }

  const baseline = latestPermanentStepAmount(plan.steps, monthKey, plan.baseBudget)
  const oneOff = oneOffStepForMonth(plan.steps, monthKey)

  return oneOff ? oneOff.amount : baseline
}
