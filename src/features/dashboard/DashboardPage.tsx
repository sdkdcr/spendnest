import { useMemo, useState } from 'react'
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

  const monthlySpentTotal = useMemo(() => {
    return visibleEntries.reduce((total, entry) => {
      if (entry.status !== 'Spent') {
        return total
      }

      return total + entry.cost
    }, 0)
  }, [visibleEntries])

  const spentEntriesCount = useMemo(() => {
    return visibleEntries.filter((entry) => entry.status === 'Spent').length
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
      <p>Monthly totals and category pie chart are now enabled for `Spent` entries.</p>

      {selectedFamilyId !== null ? (
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
      ) : null}

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
          <CategoryPieChart data={categoryTotals} colorByType={categoryColorByType} />
        </div>
      ) : null}

      {selectedFamilyId !== null ? (
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
      ) : null}
    </section>
  )
}
