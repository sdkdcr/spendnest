import { useMemo, useState } from 'react'
import type { Category, SpendPlan } from '../../shared/domain/types'
import { useAppStore } from '../../shared/state/useAppStore'
import { useFamilyCategories } from '../settings/useFamilyCategories'
import { SpendPlanFilterBar, type SpendPlanGroupBy } from './SpendPlanFilterBar'
import { SpendPlanList } from './SpendPlanList'
import { SpendPlanModals } from './SpendPlanModals'
import type { SpendPlanDraft } from './spend-plan.repository'
import { useFamilyPersons } from './useFamilyPersons'
import { useSpendPlans } from './useSpendPlans'
import './spends.css'

export function SpendsPage() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const familyPersons = useFamilyPersons(selectedFamilyId)
  const { categories } = useFamilyCategories(selectedFamilyId)
  const {
    spendPlans,
    isLoading,
    errorMessage,
    createSpendPlan,
    updateSpendPlan,
    deleteSpendPlan,
  } = useSpendPlans(selectedFamilyId)

  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<SpendPlanGroupBy>('none')
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

  const categoriesById = useMemo(() => {
    return categories.reduce<Record<number, Category>>((acc, category) => {
      if (category.id !== undefined) {
        acc[category.id] = category
      }

      return acc
    }, {})
  }, [categories])

  const effectiveSelectedPersonId = useMemo(() => {
    if (selectedPersonId === null) {
      return null
    }

    const hasSelectedPerson = familyPersons.some(
      (person) => person.id === selectedPersonId,
    )

    return hasSelectedPerson ? selectedPersonId : null
  }, [familyPersons, selectedPersonId])

  const filteredPlans = useMemo(() => {
    if (effectiveSelectedPersonId === null) {
      return spendPlans
    }

    return spendPlans.filter((plan) => plan.personId === effectiveSelectedPersonId)
  }, [spendPlans, effectiveSelectedPersonId])

  const groupedPlans = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: null, plans: filteredPlans }]
    }
    const groups = new Map<string, SpendPlan[]>()
    for (const plan of filteredPlans) {
      const key =
        groupBy === 'category' ? String(plan.categoryId) : plan.frequency
      const existing = groups.get(key)
      if (existing) existing.push(plan)
      else groups.set(key, [plan])
    }
    return Array.from(groups.entries())
      .map(([key, plans]) => ({
        key,
        label: groupBy === 'category' ? categoriesById[Number(key)]?.name ?? 'Unknown category' : key,
        plans,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [filteredPlans, groupBy, categoriesById])

  const personNamesById = useMemo(() => {
    return familyPersons.reduce<Record<number, string>>((acc, person) => {
      if (person.id !== undefined) {
        acc[person.id] = person.name
      }

      return acc
    }, {})
  }, [familyPersons])

  const editingPlan = useMemo(() => {
    if (editingPlanId === null) {
      return null
    }

    return spendPlans.find((plan) => plan.id === editingPlanId) ?? null
  }, [editingPlanId, spendPlans])

  async function handleCreatePlan(draft: SpendPlanDraft) {
    await createSpendPlan(draft)
    setIsCreateModalOpen(false)
  }

  async function handleUpdatePlan(draft: SpendPlanDraft) {
    if (editingPlanId === null) {
      return
    }

    const updated = await updateSpendPlan(editingPlanId, draft)
    if (updated) {
      setEditingPlanId(null)
    }
  }

  async function handleDeletePlan(planId: number) {
    const shouldDelete = window.confirm('Delete this spend plan?')

    if (!shouldDelete) {
      return
    }

    const deleted = await deleteSpendPlan(planId)
    if (deleted && editingPlanId === planId) {
      setEditingPlanId(null)
    }
  }

  return (
    <section className="spends-layout">
      <div>
        <h2>Spends</h2>
        <p className="families-help">
          Manage spend plans for the active family.
        </p>
      </div>

      {selectedFamilyId === null ? (
        <p className="families-help">
          Select an active family in the Families tab to create spend plans.
        </p>
      ) : (
        <>
          <SpendPlanFilterBar
            familyPersons={familyPersons}
            selectedPersonId={effectiveSelectedPersonId}
            onSelectedPersonIdChange={setSelectedPersonId}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            onAddPlan={() => {
              setIsCreateModalOpen(true)
            }}
          />

          <SpendPlanModals
            persons={familyPersons}
            categories={categories}
            isCreateModalOpen={isCreateModalOpen}
            onCloseCreateModal={() => {
              setIsCreateModalOpen(false)
            }}
            onCreatePlan={handleCreatePlan}
            editingPlan={editingPlan}
            onCloseEditModal={() => {
              setEditingPlanId(null)
            }}
            onUpdatePlan={handleUpdatePlan}
          />

          {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

          {isLoading ? (
            <p className="families-help">Loading spend plans...</p>
          ) : filteredPlans.length === 0 ? (
            <p className="families-help">
              {spendPlans.length === 0
                ? 'No spend plans added yet.'
                : 'No spend plans for this person.'}
            </p>
          ) : (
            <div className="spend-groups">
              {groupedPlans.map(({ key, label, plans }) => (
                <div key={key} className="spend-group">
                  {label !== null && <h3 className="spend-group-heading">{label}</h3>}
                  <SpendPlanList
                    spendPlans={plans}
                    personNamesById={personNamesById}
                    categoriesById={categoriesById}
                    onEdit={(plan) => {
                      if (plan.id !== undefined) setEditingPlanId(plan.id)
                    }}
                    onDelete={(planId) => {
                      void handleDeletePlan(planId)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
