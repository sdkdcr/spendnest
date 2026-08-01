import { useMemo, useState } from 'react'
import type { Category, SpendPlan } from '../../shared/domain/types'
import { projectRetirementCorpus } from './retirement-corpus'

const PROJECTION_YEAR_OPTIONS = [5, 10, 15, 20] as const

interface RetirementCorpusCardProps {
  categories: Category[]
  plans: SpendPlan[]
  currentMonthKey: string
}

export function RetirementCorpusCard({ categories, plans, currentMonthKey }: RetirementCorpusCardProps) {
  const [selectedYears, setSelectedYears] = useState(0)

  const taggedCategories = useMemo(
    () => categories.filter((category) => category.isRetirementCorpus),
    [categories],
  )

  const projections = useMemo(
    () => projectRetirementCorpus(categories, plans, currentMonthKey, selectedYears),
    [categories, plans, currentMonthKey, selectedYears],
  )

  const total = projections.reduce((sum, projection) => sum + projection.projectedBalance, 0)

  if (taggedCategories.length === 0) {
    return (
      <p className="families-help">
        No categories are tagged for the Retirement Corpus yet. Tag one in Settings to see it here.
      </p>
    )
  }

  return (
    <div className="dashboard-retirement-card">
      <div className="dashboard-budget-stats">
        <div className="dashboard-budget-stat">
          <span className="dashboard-budget-stat-value">{total.toFixed(2)}</span>
          <span className="dashboard-budget-stat-label">
            {selectedYears === 0 ? 'Current Corpus' : `Projected in ${selectedYears} years`}
          </span>
        </div>
      </div>

      <div className="dashboard-retirement-year-buttons">
        <button
          type="button"
          className={`families-button${selectedYears === 0 ? ' families-button-primary' : ''}`}
          onClick={() => {
            setSelectedYears(0)
          }}
        >
          Now
        </button>
        {PROJECTION_YEAR_OPTIONS.map((years) => (
          <button
            key={years}
            type="button"
            className={`families-button${selectedYears === years ? ' families-button-primary' : ''}`}
            onClick={() => {
              setSelectedYears(years)
            }}
          >
            +{years} years
          </button>
        ))}
      </div>

      <ul className="dashboard-retirement-breakdown">
        {projections.map((projection) => (
          <li key={projection.categoryId} className="dashboard-retirement-breakdown-item">
            <span
              className="dashboard-retirement-swatch"
              style={{ backgroundColor: projection.color }}
              aria-hidden="true"
            />
            <span className="dashboard-retirement-breakdown-name">{projection.categoryName}</span>
            <span className="dashboard-retirement-breakdown-amount">
              {projection.projectedBalance.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
