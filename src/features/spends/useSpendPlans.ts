import { useCallback, useEffect, useState } from 'react'
import type { SpendPlan } from '../../shared/domain/types'
import {
  createSpendPlan,
  deleteSpendPlan,
  listSpendPlansByFamily,
  updateSpendPlan,
  type SpendPlanDraft,
} from './spend-plan.repository'

export function useSpendPlans(familyId: number | null) {
  const [spendPlans, setSpendPlans] = useState<SpendPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshSpendPlans = useCallback(async () => {
    if (familyId === null) {
      setSpendPlans([])
      return
    }

    setErrorMessage(null)

    try {
      const nextPlans = await listSpendPlansByFamily(familyId)
      setSpendPlans(nextPlans)
    } catch {
      setErrorMessage('Unable to load spend plans right now.')
    }
  }, [familyId])

  useEffect(() => {
    async function initSpendPlans() {
      if (familyId === null) {
        setSpendPlans([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      await refreshSpendPlans()
      setIsLoading(false)
    }

    void initSpendPlans()
  }, [familyId, refreshSpendPlans])

  async function handleCreateSpendPlan(
    draft: SpendPlanDraft,
  ): Promise<SpendPlan | null> {
    if (familyId === null) {
      return null
    }

    setErrorMessage(null)

    try {
      const created = await createSpendPlan(familyId, draft)
      setSpendPlans((currentPlans) => [created, ...currentPlans])
      return created
    } catch {
      setErrorMessage('Unable to create spend plan right now.')
      return null
    }
  }

  async function handleUpdateSpendPlan(
    planId: number,
    draft: SpendPlanDraft,
  ): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await updateSpendPlan(planId, familyId, draft)
      const refreshed = await listSpendPlansByFamily(familyId)
      setSpendPlans(refreshed)
      return true
    } catch {
      setErrorMessage('Unable to update spend plan right now.')
      return false
    }
  }

  async function handleDeleteSpendPlan(planId: number): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await deleteSpendPlan(planId, familyId)
      setSpendPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== planId),
      )
      return true
    } catch {
      setErrorMessage('Unable to delete spend plan right now.')
      return false
    }
  }

  return {
    spendPlans,
    isLoading,
    errorMessage,
    createSpendPlan: handleCreateSpendPlan,
    updateSpendPlan: handleUpdateSpendPlan,
    deleteSpendPlan: handleDeleteSpendPlan,
    refreshSpendPlans,
  }
}
