import { useMemo, useState } from 'react'
import { useAppStore } from '../../shared/state/useAppStore'
import { useFamilyPersons } from '../spends/useFamilyPersons'
import { BudgetProjectionChart } from './BudgetProjectionChart'
import { BudgetTotalCard } from './BudgetTotalCard'
import { CategoryPieChart } from './CategoryPieChart'
import { SpendPlanPanel } from './SpendPlanPanel'
import { buildCategoryColorMap } from './category-colors'
import { resolvePlansForMonth } from './resolved-plan'
import { useBudgetProjection } from './useBudgetProjection'
import { useDashboardData } from './useDashboardData'
import './dashboard.css'

export function DashboardPage() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)
  const familyPersons = useFamilyPersons(selectedFamilyId)
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

  const { spendPlans, isLoading, errorMessage } = useDashboardData(selectedFamilyId)
  const projectionData = useBudgetProjection(spendPlans, selectedMonthKey)

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

  const filteredPlans = useMemo(() => {
    if (effectiveSelectedPersonId === null) {
      return spendPlans
    }

    return spendPlans.filter((plan) => plan.personId === effectiveSelectedPersonId)
  }, [spendPlans, effectiveSelectedPersonId])

  const resolvedPlans = useMemo(
    () => resolvePlansForMonth(filteredPlans, selectedMonthKey),
    [filteredPlans, selectedMonthKey],
  )

  const totalAmount = useMemo(
    () => resolvedPlans.reduce((sum, plan) => sum + plan.amount, 0),
    [resolvedPlans],
  )

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()

    resolvedPlans.forEach((plan) => {
      const currentAmount = totals.get(plan.type) ?? 0
      totals.set(plan.type, currentAmount + plan.amount)
    })

    return Array.from(totals.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [resolvedPlans])

  const categoryColorByType = useMemo(() => {
    return buildCategoryColorMap(resolvedPlans.map((plan) => plan.type))
  }, [resolvedPlans])

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
            <h3>Budget for {selectedMonthKey}</h3>

            {errorMessage ? (
              <p className="families-error">{errorMessage}</p>
            ) : (
              <BudgetTotalCard totalAmount={totalAmount} planCount={resolvedPlans.length} />
            )}
          </div>

          <div className="dashboard-chart-panel">
            <h3>Budget Projection</h3>
            <BudgetProjectionChart data={projectionData} selectedMonthKey={selectedMonthKey} />
          </div>

          <div className="dashboard-chart-panel">
            <h3>Category Spend Split</h3>
            <CategoryPieChart data={categoryTotals} colorByType={categoryColorByType} />
          </div>

          <SpendPlanPanel
            plans={resolvedPlans}
            personNamesById={personNamesById}
            categoryColorByType={categoryColorByType}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </>
      )}
    </section>
  )
}
