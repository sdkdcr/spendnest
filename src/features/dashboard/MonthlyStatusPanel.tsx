import { useState } from 'react'
import type { MonthlySpendEntry, MonthlySpendStatus } from '../../shared/domain/types'
import { Modal } from '../../shared/ui/Modal'
import { getCategoryColor } from './category-colors'

interface MonthlyStatusPanelProps {
  entries: MonthlySpendEntry[]
  personNamesById: Record<number, string>
  categoryColorByType: Record<string, string>
  isLoading: boolean
  errorMessage: string | null
  onSetStatus: (entryId: number, status: MonthlySpendStatus) => void
  onUpdateEntryDetails: (
    entryId: number,
    patch: Pick<MonthlySpendEntry, 'cost' | 'quantity'>,
  ) => void
}

const statusOptions: MonthlySpendStatus[] = ['Spent', 'Not Yet', 'Skip']

export function MonthlyStatusPanel({
  entries,
  personNamesById,
  categoryColorByType,
  isLoading,
  errorMessage,
  onSetStatus,
  onUpdateEntryDetails,
}: MonthlyStatusPanelProps) {
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [draftCost, setDraftCost] = useState('')
  const [draftQuantity, setDraftQuantity] = useState('')
  const editingEntry =
    editingEntryId === null
      ? null
      : entries.find((entry) => entry.id === editingEntryId) ?? null

  function startEditing(entry: MonthlySpendEntry) {
    if (entry.id === undefined) {
      return
    }

    setEditingEntryId(entry.id)
    setDraftCost(String(entry.cost))
    setDraftQuantity(entry.quantity)
  }

  function cancelEditing() {
    setEditingEntryId(null)
    setDraftCost('')
    setDraftQuantity('')
  }

  function saveEditing(entryId: number) {
    const nextCost = Number(draftCost)
    const nextQuantity = draftQuantity.trim()

    if (!Number.isFinite(nextCost) || nextCost < 0) {
      return
    }

    onUpdateEntryDetails(entryId, {
      cost: nextCost,
      quantity: nextQuantity,
    })
    cancelEditing()
  }

  return (
    <div className="dashboard-status-panel">
      <h3>Monthly Status Workflow</h3>

      {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

      {isLoading ? (
        <p className="families-help">Loading monthly entries...</p>
      ) : entries.length === 0 ? (
        <p className="families-help">No monthly entries available for this month.</p>
      ) : (
        <ul className="dashboard-entry-list">
          {entries.map((entry) => {
            const entryId = entry.id
            if (entryId === undefined) {
              return null
            }

            return (
              <li className="dashboard-entry-item" key={entryId}>
                <span
                  className="dashboard-entry-ribbon"
                  style={{ backgroundColor: getCategoryColor(entry.type, categoryColorByType) }}
                  aria-hidden="true"
                />
                <div className="dashboard-entry-row">
                  <div>
                    <p className="dashboard-entry-name">{entry.name}</p>
                    <p className="dashboard-entry-meta">
                      {entry.type} | Cost: {entry.cost} | Qty: {entry.quantity}
                    </p>
                    <p className="dashboard-entry-meta">
                      Person:{' '}
                      {entry.personId !== undefined
                        ? personNamesById[entry.personId] ?? 'Unknown'
                        : 'Unassigned'}
                    </p>
                  </div>

                  <div className="dashboard-entry-actions">
                    <div className="dashboard-status-group" role="group" aria-label="Status">
                      {statusOptions.map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          className={
                            entry.status === statusOption
                              ? 'dashboard-status-btn dashboard-status-btn-active'
                              : 'dashboard-status-btn'
                          }
                          onClick={() => {
                            onSetStatus(entryId, statusOption)
                          }}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="dashboard-status-btn"
                      onClick={() => {
                        startEditing(entry)
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

              </li>
            )
          })}
        </ul>
      )}

      {editingEntry ? (
        <Modal
          title={`Edit ${editingEntry.name}`}
          onClose={cancelEditing}
        >
          {/* editingEntry exists only when editingEntryId is set */}
          <div className="dashboard-entry-edit">
            <label>
              Cost
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftCost}
                onChange={(event) => {
                  setDraftCost(event.currentTarget.value)
                }}
              />
            </label>
            <label>
              Qty
              <input
                type="text"
                value={draftQuantity}
                onChange={(event) => {
                  setDraftQuantity(event.currentTarget.value)
                }}
              />
            </label>
            <div className="dashboard-entry-edit-actions">
              <button
                type="button"
                className="dashboard-status-btn dashboard-status-btn-active"
                onClick={() => {
                  if (editingEntryId !== null) {
                    saveEditing(editingEntryId)
                  }
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="dashboard-status-btn"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
