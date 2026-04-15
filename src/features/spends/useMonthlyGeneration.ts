import { useEffect, useState } from 'react'
import {
  ensureMonthlyEntries,
  type MonthlyGenerationResult,
} from './monthly-entry.generator'

export function useMonthlyGeneration(
  familyId: number | null,
  monthKey: string,
) {
  const [result, setResult] = useState<MonthlyGenerationResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function syncMonthlyEntries() {
      if (familyId === null) {
        setResult(null)
        setErrorMessage(null)
        setIsSyncing(false)
        return
      }

      setIsSyncing(true)
      setErrorMessage(null)

      try {
        const nextResult = await ensureMonthlyEntries(familyId, monthKey)

        if (!isCancelled) {
          setResult(nextResult)
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage('Unable to generate monthly entries right now.')
        }
      } finally {
        if (!isCancelled) {
          setIsSyncing(false)
        }
      }
    }

    void syncMonthlyEntries()

    return () => {
      isCancelled = true
    }
  }, [familyId, monthKey])

  return {
    result,
    isSyncing,
    errorMessage,
  }
}
