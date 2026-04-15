import { useEffect, useState } from 'react'
import type { MonthlySpendEntry, MonthlySpendStatus } from '../../shared/domain/types'
import {
  applyEmiAutoStatus,
  listMonthlyEntries,
  updateMonthlyEntryStatus,
} from './monthly-status.repository'

export function useMonthlyStatus(
  familyId: number | null,
  monthKey: string,
  canLoad: boolean,
) {
  const [entries, setEntries] = useState<MonthlySpendEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadEntries() {
      if (familyId === null || !canLoad) {
        setEntries([])
        setIsLoading(false)
        setErrorMessage(null)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        await applyEmiAutoStatus(familyId, monthKey)
        const nextEntries = await listMonthlyEntries(familyId, monthKey)

        if (!isCancelled) {
          setEntries(nextEntries)
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage('Unable to load monthly entries right now.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadEntries()

    return () => {
      isCancelled = true
    }
  }, [familyId, monthKey, canLoad])

  async function setEntryStatus(
    entryId: number,
    status: MonthlySpendStatus,
  ): Promise<void> {
    setErrorMessage(null)

    try {
      await updateMonthlyEntryStatus(entryId, status)
      setEntries((currentEntries) =>
        currentEntries.map((entry) => {
          if (entry.id !== entryId) {
            return entry
          }

          return {
            ...entry,
            status,
            manuallyUpdatedStatus: true,
          }
        }),
      )
    } catch {
      setErrorMessage('Unable to update status right now.')
    }
  }

  return {
    entries,
    isLoading,
    errorMessage,
    setEntryStatus,
  }
}
