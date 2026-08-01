import { getCategoryColor } from '../dashboard/category-colors'
import type { SpendPlan } from '../../shared/domain/types'

interface SpendPlanListProps {
  spendPlans: SpendPlan[]
  personNamesById: Record<number, string>
  categoryColorByType: Record<string, string>
  onEdit: (plan: SpendPlan) => void
  onDelete: (planId: number) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SpendPlanList({
  spendPlans,
  personNamesById,
  categoryColorByType,
  onEdit,
  onDelete,
}: SpendPlanListProps) {
  return (
    <ul className="spend-template-list">
      {spendPlans.map((plan) => {
        const planId = plan.id
        if (planId === undefined) {
          return null
        }

        const personTag =
          plan.personId !== undefined
            ? personNamesById[plan.personId] ?? 'Unknown person'
            : 'Unassigned'

        const hasSchedule = plan.dayOfDeduction !== undefined || plan.endDate !== undefined
        const scheduleLabel = hasSchedule
          ? [
              `Day ${plan.dayOfDeduction ?? '-'}`,
              plan.endDate ? `Until ${plan.endDate}` : null,
            ]
              .filter(Boolean)
              .join(' | ')
          : 'No end date'

        return (
          <li className="spend-template-item" key={planId}>
            <span
              className="spend-ribbon-category"
              style={{ backgroundColor: getCategoryColor(plan.type, categoryColorByType), color: '#fff' }}
            >
              {plan.type || '—'}
            </span>
            <span className="spend-ribbon-frequency">{plan.frequency}</span>

            <div className="spend-template-header">
              <p className="spend-template-name">{plan.name}</p>
              <p className="spend-template-amount">{formatCurrency(plan.baseBudget)}</p>
            </div>

            <div className="spend-template-chip-row">
              <span className="spend-template-chip">{personTag}</span>
            </div>

            <div className="spend-template-detail-grid">
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">Quantity</span>
                <span>{plan.quantity}</span>
              </p>
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">Schedule</span>
                <span>{scheduleLabel}</span>
              </p>
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">Cycle from</span>
                <span>{plan.startMonth}</span>
              </p>
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">Steps</span>
                <span>{plan.steps.length}</span>
              </p>
            </div>

            <div className="spend-template-actions-row">
              <button
                className="families-button"
                type="button"
                onClick={() => {
                  onEdit(plan)
                }}
              >
                Edit
              </button>
              <button
                className="families-button spend-template-delete"
                type="button"
                onClick={() => {
                  onDelete(planId)
                }}
              >
                Delete
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
