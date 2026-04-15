import { useMemo } from 'react'
import { CategoryPieChart } from './CategoryPieChart'
import { MonthlyStatusPanel } from './MonthlyStatusPanel'
import './dashboard.css'
import { useAppStore } from '../../shared/state/useAppStore'
import { useMonthlyGeneration } from '../spends/useMonthlyGeneration'
import { useMonthlyStatus } from './useMonthlyStatus'

export function DashboardPage() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)

  const { result, isSyncing, errorMessage: generationError } = useMonthlyGeneration(
    selectedFamilyId,
    selectedMonthKey,
  )

  const {
    entries,
    isLoading: isLoadingEntries,
    errorMessage: statusError,
    setEntryStatus,
  } = useMonthlyStatus(selectedFamilyId, selectedMonthKey, !isSyncing)

  const monthlySpentTotal = useMemo(() => {
    return entries.reduce((total, entry) => {
      if (entry.status !== 'Spent') {
        return total
      }

      return total + entry.cost
    }, 0)
  }, [entries])

  const spentEntriesCount = useMemo(() => {
    return entries.filter((entry) => entry.status === 'Spent').length
  }, [entries])

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()

    entries.forEach((entry) => {
      if (entry.status !== 'Spent') {
        return
      }

      const currentAmount = totals.get(entry.type) ?? 0
      totals.set(entry.type, currentAmount + entry.cost)
    })

    return Array.from(totals.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [entries])

  return (
    <section>
      <h2>Dashboard</h2>
      <p>Monthly totals and category pie chart are now enabled for `Spent` entries.</p>

      <div className="dashboard-sync-panel">
        <h3>Monthly Entry Generation</h3>

        {selectedFamilyId === null ? (
          <p className="families-help">
            Select a family to generate monthly entries.
          </p>
        ) : isSyncing ? (
          <p className="families-help">Syncing monthly entries...</p>
        ) : generationError ? (
          <p className="families-error">{generationError}</p>
        ) : result ? (
          <p className="families-help">
            Month: {selectedMonthKey} | Templates: {result.templateCount} |
            Eligible: {result.eligibleCount} | Existing: {result.existingCount} |
            Created: {result.createdCount}
          </p>
        ) : (
          <p className="families-help">No sync result available yet.</p>
        )}
      </div>

      {selectedFamilyId !== null ? (
        <div className="dashboard-total-panel">
          <h3>Monthly Total Expenditure</h3>
          <p className="dashboard-total-value">{monthlySpentTotal.toFixed(2)}</p>
          <p className="families-help">
            Based on `Spent` entries only | Count: {spentEntriesCount}
          </p>
        </div>
      ) : null}

      {selectedFamilyId !== null ? (
        <div className="dashboard-chart-panel">
          <h3>Category Spend Split</h3>
          <CategoryPieChart data={categoryTotals} />
        </div>
      ) : null}

      {selectedFamilyId !== null ? (
        <MonthlyStatusPanel
          entries={entries}
          isLoading={isLoadingEntries || isSyncing}
          errorMessage={statusError}
          onSetStatus={(entryId, status) => {
            void setEntryStatus(entryId, status)
          }}
        />
      ) : null}
    </section>
  )
}
