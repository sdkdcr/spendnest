import { useCallback, useEffect, useState } from 'react'
import type { Person } from '../../shared/domain/types'
import {
  createPerson,
  deletePerson,
  listPersonsByFamily,
  renamePerson,
} from './person.repository'

export function usePersons(familyId: number | null) {
  const [persons, setPersons] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshPersons = useCallback(async () => {
    if (familyId === null) {
      setPersons([])
      return
    }

    setErrorMessage(null)

    try {
      const nextPersons = await listPersonsByFamily(familyId)
      setPersons(nextPersons)
    } catch {
      setErrorMessage('Unable to load persons right now.')
    }
  }, [familyId])

  useEffect(() => {
    async function initPersons() {
      if (familyId === null) {
        setPersons([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      await refreshPersons()
      setIsLoading(false)
    }

    void initPersons()
  }, [familyId, refreshPersons])

  async function handleCreatePerson(name: string): Promise<Person | null> {
    if (familyId === null) {
      return null
    }

    setErrorMessage(null)

    try {
      const createdPerson = await createPerson(familyId, name)
      setPersons((currentPersons) => [createdPerson, ...currentPersons])
      return createdPerson
    } catch {
      setErrorMessage('Unable to create person right now.')
      return null
    }
  }

  async function handleRenamePerson(
    personId: number,
    name: string,
  ): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await renamePerson(personId, name)
      const refreshedPersons = await listPersonsByFamily(familyId)
      setPersons(refreshedPersons)
      return true
    } catch {
      setErrorMessage('Unable to update person right now.')
      return false
    }
  }

  async function handleDeletePerson(personId: number): Promise<boolean> {
    setErrorMessage(null)

    try {
      await deletePerson(personId)
      setPersons((currentPersons) =>
        currentPersons.filter((person) => person.id !== personId),
      )
      return true
    } catch {
      setErrorMessage('Unable to delete person right now.')
      return false
    }
  }

  return {
    persons,
    isLoading,
    errorMessage,
    createPerson: handleCreatePerson,
    renamePerson: handleRenamePerson,
    deletePerson: handleDeletePerson,
    refreshPersons,
  }
}
