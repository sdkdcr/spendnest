import { getCategoryColor } from '../dashboard/category-colors'
import type { SpendTemplate } from '../../shared/domain/types'

interface SpendTemplateListProps {
  spendTemplates: SpendTemplate[]
  personNamesById: Record<number, string>
  categoryColorByType: Record<string, string>
  onEdit: (template: SpendTemplate) => void
  onDelete: (templateId: number) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SpendTemplateList({
  spendTemplates,
  personNamesById,
  categoryColorByType,
  onEdit,
  onDelete,
}: SpendTemplateListProps) {
  return (
    <ul className="spend-template-list">
      {spendTemplates.map((template) => {
        const templateId = template.id
        if (templateId === undefined) {
          return null
        }

        const personTag =
          template.personId !== undefined
            ? personNamesById[template.personId] ?? 'Unknown person'
            : 'Unassigned'

        const hasEmi =
          template.emiAmount !== undefined ||
          template.deductionDayOfMonth !== undefined ||
          template.emiEndMonth !== undefined
        const emiLabel = hasEmi
          ? [
              `EMI ${template.emiAmount !== undefined ? formatCurrency(template.emiAmount) : '-'}`,
              `Day ${template.deductionDayOfMonth ?? '-'}`,
              template.emiEndMonth ? `Until ${template.emiEndMonth}` : null,
            ]
              .filter(Boolean)
              .join(' | ')
          : 'No EMI'

        return (
          <li className="spend-template-item" key={templateId}>
            <span
              className="spend-ribbon-category"
              style={{ backgroundColor: getCategoryColor(template.type, categoryColorByType), color: '#fff' }}
            >
              {template.type || '—'}
            </span>
            <span className="spend-ribbon-frequency">{template.frequency}</span>

            <div className="spend-template-header">
              <p className="spend-template-name">{template.name}</p>
              <p className="spend-template-amount">{formatCurrency(template.cost)}</p>
            </div>

            <div className="spend-template-chip-row">
              <span className="spend-template-chip">{personTag}</span>
            </div>

            <div className="spend-template-detail-grid">
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">Quantity</span>
                <span>{template.quantity}</span>
              </p>
              <p className="spend-template-meta">
                <span className="spend-template-meta-key">EMI</span>
                <span>{emiLabel}</span>
              </p>
              {(template.frequency === 'Quarterly' || template.frequency === 'Annually') &&
                template.startMonth && (
                  <p className="spend-template-meta">
                    <span className="spend-template-meta-key">Cycle from</span>
                    <span>{template.startMonth}</span>
                  </p>
                )}
            </div>

            <div className="spend-template-actions-row">
              <button
                className="families-button"
                type="button"
                onClick={() => {
                  onEdit(template)
                }}
              >
                Edit
              </button>
              <button
                className="families-button spend-template-delete"
                type="button"
                onClick={() => {
                  onDelete(templateId)
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
