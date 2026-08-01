import { useMemo, useState } from 'react'
import type { Category, SpendPlan } from '../../shared/domain/types'
import { useAppStore } from '../../shared/state/useAppStore'
import { Modal } from '../../shared/ui/Modal'
import { useFamilyCategories } from '../settings/useFamilyCategories'
import { SpendPlanForm } from './SpendPlanForm'
import { SpendPlanList } from './SpendPlanList'
import type { SpendPlanDraft } from './spend-plan.repository'
import { useFamilyPersons } from './useFamilyPersons'
import { useSpendPlans } from './useSpendPlans'
import './spends.css'

function toDraft(plan: SpendPlan): SpendPlanDraft {
  return {
    personId: plan.personId,
    categoryId: plan.categoryId,
    name: plan.name,
    frequency: plan.frequency,
    baseBudget: plan.baseBudget,
    startMonth: plan.startMonth,
    endDate: plan.endDate,
    dayOfDeduction: plan.dayOfDeduction,
    quantity: plan.quantity,
    steps: plan.steps,
  }
}

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
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'frequency'>('none')

  const categoriesById = useMemo(() => {
    return categories.reduce<Record<number, Category>>((acc, category) => {
      if (category.id !== undefined) {
        acc[category.id] = category
      }

      return acc
    }, {})
  }, [categories])

  const groupedPlans = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: null, plans: spendPlans }]
    }
    const groups = new Map<string, SpendPlan[]>()
    for (const plan of spendPlans) {
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
  }, [spendPlans, groupBy, categoriesById])

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
          <div className="spend-template-toolbar">
            <button
              className="families-button families-button-primary"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(true)
              }}
            >
              Add Spend Plan
            </button>
            <div className="spend-group-by">
              <span className="spend-group-by-label">Group:</span>
              {(['none', 'category', 'frequency'] as const).map((option) => (
                <button
                  key={option}
                  className={`families-button${groupBy === option ? ' families-button-primary' : ''}`}
                  type="button"
                  onClick={() => { setGroupBy(option) }}
                >
                  {option === 'none' ? 'None' : option === 'category' ? 'Category' : 'Frequency'}
                </button>
              ))}
            </div>
          </div>

          {isCreateModalOpen ? (
            <Modal
              title="Create Spend Plan"
              onClose={() => {
                setIsCreateModalOpen(false)
              }}
            >
              <SpendPlanForm
                key="create-plan-form"
                title="Create Spend Plan"
                submitLabel="Add Plan"
                hideTitle
                persons={familyPersons}
                categories={categories}
                onSubmit={handleCreatePlan}
                onCancel={() => {
                  setIsCreateModalOpen(false)
                }}
              />
            </Modal>
          ) : null}

          {editingPlan ? (
            <Modal
              title="Edit Spend Plan"
              onClose={() => {
                setEditingPlanId(null)
              }}
            >
              <SpendPlanForm
                key={`edit-plan-${editingPlan.id ?? 'unknown'}`}
                title="Edit Spend Plan"
                submitLabel="Save Changes"
                hideTitle
                persons={familyPersons}
                categories={categories}
                initialDraft={toDraft(editingPlan)}
                onSubmit={handleUpdatePlan}
                onCancel={() => {
                  setEditingPlanId(null)
                }}
              />
            </Modal>
          ) : null}

          {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

          {isLoading ? (
            <p className="families-help">Loading spend plans...</p>
          ) : spendPlans.length === 0 ? (
            <p className="families-help">No spend plans added yet.</p>
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
