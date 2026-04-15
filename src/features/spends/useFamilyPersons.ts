import { useEffect, useState } from 'react'
import { appDb } from '../../shared/db/appDb'
import type { Person } from '../../shared/domain/types'

export function useFamilyPersons(familyId: number | null) {
  const [persons, setPersons] = useState<Person[]>([])

  useEffect(() => {
    let isCancelled = false

    async function loadPersons() {
      if (familyId === null) {
        setPersons([])
        return
      }

      const nextPersons = await appDb.persons
        .where('familyId')
        .equals(familyId)
        .reverse()
        .sortBy('updatedAt')

      if (!isCancelled) {
        setPersons(nextPersons)
      }
    }

    void loadPersons()

    return () => {
      isCancelled = true
    }
  }, [familyId])

  return persons
}
