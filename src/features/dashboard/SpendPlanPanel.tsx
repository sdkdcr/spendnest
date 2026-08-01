import { useMemo, useState } from 'react'
import { getCategoryColor } from './category-colors'
import { computeBudgetScores, scoreToColor, scoreToTextColor } from './budget-score'
import { PlanSortBar } from './PlanSortBar'
import { sortPlansByKey, type PlanSortKey } from './plan-sort'
import type { ResolvedPlan } from './resolved-plan'

interface SpendPlanPanelProps {
  plans: ResolvedPlan[]
  personNamesById: Record<number, string>
  categoryColorByType: Record<string, string>
  isLoading: boolean
  errorMessage: string | null
}

export function SpendPlanPanel({
  plans,
  personNamesById,
  categoryColorByType,
  isLoading,
  errorMessage,
}: SpendPlanPanelProps) {
  const [sortKey, setSortKey] = useState<PlanSortKey>('category')

  const scores = useMemo(
    () => computeBudgetScores(plans.map((plan) => ({ planId: plan.planId, amount: plan.amount }))),
    [plans],
  )
  const sortedPlans = useMemo(() => sortPlansByKey(plans, sortKey), [plans, sortKey])

  return (
    <div className="dashboard-status-panel">
      <h3>Spend Plans This Month</h3>

      {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

      {isLoading ? (
        <p className="families-help">Loading spend plans...</p>
      ) : plans.length === 0 ? (
        <p className="families-help">No spend plans eligible for this month.</p>
      ) : (
        <>
          <PlanSortBar value={sortKey} onChange={setSortKey} />
          <ul className="dashboard-entry-list">
            {sortedPlans.map((plan) => {
              const score = scores.get(plan.planId) ?? 1

              return (
                <li className="dashboard-entry-item" key={plan.planId}>
                  <span
                    className="dashboard-entry-ribbon"
                    style={{ backgroundColor: getCategoryColor(plan.type, categoryColorByType) }}
                    aria-hidden="true"
                  />
                  <div className="dashboard-entry-row">
                    <div>
                      <div className="dashboard-entry-name-row">
                        <p className="dashboard-entry-name">{plan.name}</p>
                        <span
                          className="dashboard-score-badge"
                          style={{
                            backgroundColor: scoreToColor(score),
                            color: scoreToTextColor(score),
                          }}
                          title={`Budget impact score: ${score}/10`}
                        >
                          {score}/10
                        </span>
                      </div>
                      <p className="dashboard-entry-meta">
                        {plan.type} | Amount: {plan.amount} | Qty: {plan.quantity}
                        {plan.dayOfDeduction !== undefined
                          ? ` | Due on ${plan.dayOfDeduction}`
                          : ''}
                      </p>
                      <p className="dashboard-entry-meta">
                        Person:{' '}
                        {plan.personId !== undefined
                          ? personNamesById[plan.personId] ?? 'Unknown'
                          : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
