import { useMemo, useState } from 'react'
import { BudgetBreakdownChart } from './BudgetBreakdownChart'
import { CategoryPieChart } from './CategoryPieChart'
import { MonthlyStatusPanel } from './MonthlyStatusPanel'
import { buildCategoryColorMap } from './category-colors'
import './dashboard.css'
import { useAppStore } from '../../shared/state/useAppStore'
import { useMonthlyGeneration } from '../spends/useMonthlyGeneration'
import { useFamilyPersons } from '../spends/useFamilyPersons'
import { useMonthlyStatus } from './useMonthlyStatus'

export function DashboardPage() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)
  const familyPersons = useFamilyPersons(selectedFamilyId)
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

  const { result, isSyncing, errorMessage: generationError } = useMonthlyGeneration(
    selectedFamilyId,
    selectedMonthKey,
  )

  const {
    entries,
    isLoading: isLoadingEntries,
    errorMessage: statusError,
    setEntryStatus,
    updateEntryDetails,
  } = useMonthlyStatus(selectedFamilyId, selectedMonthKey, !isSyncing)
  const effectiveSelectedPersonId = useMemo(() => {
    if (selectedPersonId === null) {
      return null
    }

    const hasSelectedPerson = familyPersons.some(
      (person) => person.id === selectedPersonId,
    )

    return hasSelectedPerson ? selectedPersonId : null
  }, [familyPersons, selectedPersonId])

  const personNamesById = useMemo(() => {
    return familyPersons.reduce<Record<number, string>>((acc, person) => {
      if (person.id !== undefined) {
        acc[person.id] = person.name
      }

      return acc
    }, {})
  }, [familyPersons])

  const visibleEntries = useMemo(() => {
    if (effectiveSelectedPersonId === null) {
      return entries
    }

    return entries.filter((entry) => entry.personId === effectiveSelectedPersonId)
  }, [entries, effectiveSelectedPersonId])

  const spentEntriesCount = useMemo(() => {
    return visibleEntries.filter((entry) => entry.status === 'Spent').length
  }, [visibleEntries])

  const budgetBreakdown = useMemo(() => {
    return visibleEntries.reduce(
      (acc, entry) => {
        acc.budget += entry.cost
        if (entry.status === 'Spent') acc.spent += entry.cost
        if (entry.status === 'Not Yet') acc.pending += entry.cost
        return acc
      },
      { budget: 0, spent: 0, pending: 0 },
    )
  }, [visibleEntries])

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()

    visibleEntries.forEach((entry) => {
      if (entry.status !== 'Spent') {
        return
      }

      const currentAmount = totals.get(entry.type) ?? 0
      totals.set(entry.type, currentAmount + entry.cost)
    })

    return Array.from(totals.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [visibleEntries])

  const categoryColorByType = useMemo(() => {
    return buildCategoryColorMap(visibleEntries.map((entry) => entry.type))
  }, [visibleEntries])

  return (
    <section>
      <h2>Dashboard</h2>
      {selectedFamilyId === null ? (
        <p className="families-help">Select a family to view your budget.</p>
      ) : (
        <>
          <div className="dashboard-filter-row">
            <label htmlFor="dashboard-person-filter">View scope</label>
            <select
              id="dashboard-person-filter"
              className="dashboard-filter-select"
              value={effectiveSelectedPersonId === null ? '' : String(effectiveSelectedPersonId)}
              onChange={(event) => {
                const value = event.currentTarget.value
                setSelectedPersonId(value ? Number(value) : null)
              }}
            >
              <option value="">Entire Family</option>
              {familyPersons.map((person) => {
                if (person.id === undefined) {
                  return null
                }

                return (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="dashboard-chart-panel">
            <h3>Budget Breakdown</h3>

            {generationError ? (
              <p className="families-error">{generationError}</p>
            ) : (
              <div className="dashboard-budget-stats">
                <div className="dashboard-budget-stat">
                  <span className="dashboard-budget-stat-value">{budgetBreakdown.budget.toFixed(2)}</span>
                  <span className="dashboard-budget-stat-label">Budget</span>
                </div>
                <div className="dashboard-budget-stat">
                  <span className="dashboard-budget-stat-value dashboard-stat-spent">{budgetBreakdown.spent.toFixed(2)}</span>
                  <span className="dashboard-budget-stat-label">Spent · {spentEntriesCount}</span>
                </div>
                <div className="dashboard-budget-stat">
                  <span className="dashboard-budget-stat-value dashboard-stat-pending">{budgetBreakdown.pending.toFixed(2)}</span>
                  <span className="dashboard-budget-stat-label">Pending</span>
                </div>
              </div>
            )}

            <BudgetBreakdownChart data={budgetBreakdown} monthKey={selectedMonthKey} />

            <p className="families-help dashboard-budget-footnote">
              {isSyncing
                ? 'Updating entries...'
                : result
                  ? `${result.eligibleCount} entries · ${result.createdCount > 0 ? `${result.createdCount} new` : 'up to date'}`
                  : ''}
            </p>
          </div>

          <div className="dashboard-chart-panel">
            <h3>Category Spend Split</h3>
            <CategoryPieChart data={categoryTotals} colorByType={categoryColorByType} />
          </div>

          <MonthlyStatusPanel
            entries={visibleEntries}
            personNamesById={personNamesById}
            categoryColorByType={categoryColorByType}
            isLoading={isLoadingEntries || isSyncing}
            errorMessage={statusError}
            onSetStatus={(entryId, status) => {
              void setEntryStatus(entryId, status)
            }}
            onUpdateEntryDetails={(entryId, patch) => {
              void updateEntryDetails(entryId, patch)
            }}
          />
        </>
      )}
    </section>
  )
}
