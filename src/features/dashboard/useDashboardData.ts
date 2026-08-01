import { useEffect, useState } from 'react'
import type { SpendPlan } from '../../shared/domain/types'
import { listSpendPlansByFamily } from '../spends/spend-plan.repository'

export function useDashboardData(familyId: number | null) {
  const [spendPlans, setSpendPlans] = useState<SpendPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadPlans() {
      if (familyId === null) {
        setSpendPlans([])
        setIsLoading(false)
        setErrorMessage(null)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextPlans = await listSpendPlansByFamily(familyId)
        if (!isCancelled) {
          setSpendPlans(nextPlans)
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage('Unable to load spend plans right now.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPlans()

    return () => {
      isCancelled = true
    }
  }, [familyId])

  return { spendPlans, isLoading, errorMessage }
}
