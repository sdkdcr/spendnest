import { useState } from 'react'
import type { Category } from '../../shared/domain/types'
import type { RetirementSettings } from './category.repository'

interface CategoryRetirementFieldsProps {
  category: Category
  onSave: (settings: RetirementSettings) => Promise<boolean>
}

export function CategoryRetirementFields({ category, onSave }: CategoryRetirementFieldsProps) {
  const [isEnabled, setIsEnabled] = useState(category.isRetirementCorpus ?? false)
  const [currentBalance, setCurrentBalance] = useState(
    category.retirementCurrentBalance !== undefined ? String(category.retirementCurrentBalance) : '',
  )
  const [growthRate, setGrowthRate] = useState(
    category.retirementAnnualGrowthRatePercent !== undefined
      ? String(category.retirementAnnualGrowthRatePercent)
      : '',
  )

  async function handleSave() {
    await onSave({
      isRetirementCorpus: isEnabled,
      retirementCurrentBalance: currentBalance === '' ? undefined : Number(currentBalance),
      retirementAnnualGrowthRatePercent: growthRate === '' ? undefined : Number(growthRate),
    })
  }

  return (
    <div className="settings-category-retirement">
      <label className="settings-category-retirement-toggle">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(event) => {
            setIsEnabled(event.currentTarget.checked)
          }}
        />
        Counts toward Retirement Corpus
      </label>

      {isEnabled ? (
        <div className="settings-category-retirement-fields">
          <label>
            Current balance
            <input
              className="families-input"
              type="number"
              min="0"
              step="0.01"
              value={currentBalance}
              onChange={(event) => {
                setCurrentBalance(event.currentTarget.value)
              }}
            />
          </label>
          <label>
            Assumed annual growth rate (%)
            <input
              className="families-input"
              type="number"
              min="0"
              step="0.1"
              value={growthRate}
              onChange={(event) => {
                setGrowthRate(event.currentTarget.value)
              }}
            />
          </label>
        </div>
      ) : null}

      <button
        className="families-button families-button-primary"
        type="button"
        onClick={() => {
          void handleSave()
        }}
      >
        Save
      </button>
    </div>
  )
}
