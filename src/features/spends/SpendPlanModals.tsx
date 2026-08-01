import type { Category, Person, SpendPlan } from '../../shared/domain/types'
import { Modal } from '../../shared/ui/Modal'
import { SpendPlanForm } from './SpendPlanForm'
import type { SpendPlanDraft } from './spend-plan.repository'

interface SpendPlanModalsProps {
  persons: Person[]
  categories: Category[]
  isCreateModalOpen: boolean
  onCloseCreateModal: () => void
  onCreatePlan: (draft: SpendPlanDraft) => Promise<void>
  editingPlan: SpendPlan | null
  onCloseEditModal: () => void
  onUpdatePlan: (draft: SpendPlanDraft) => Promise<void>
}

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

export function SpendPlanModals({
  persons,
  categories,
  isCreateModalOpen,
  onCloseCreateModal,
  onCreatePlan,
  editingPlan,
  onCloseEditModal,
  onUpdatePlan,
}: SpendPlanModalsProps) {
  return (
    <>
      {isCreateModalOpen ? (
        <Modal title="Create Spend Plan" onClose={onCloseCreateModal}>
          <SpendPlanForm
            key="create-plan-form"
            title="Create Spend Plan"
            submitLabel="Add Plan"
            hideTitle
            persons={persons}
            categories={categories}
            onSubmit={onCreatePlan}
            onCancel={onCloseCreateModal}
          />
        </Modal>
      ) : null}

      {editingPlan ? (
        <Modal title="Edit Spend Plan" onClose={onCloseEditModal}>
          <SpendPlanForm
            key={`edit-plan-${editingPlan.id ?? 'unknown'}`}
            title="Edit Spend Plan"
            submitLabel="Save Changes"
            hideTitle
            persons={persons}
            categories={categories}
            initialDraft={toDraft(editingPlan)}
            onSubmit={onUpdatePlan}
            onCancel={onCloseEditModal}
          />
        </Modal>
      ) : null}
    </>
  )
}
