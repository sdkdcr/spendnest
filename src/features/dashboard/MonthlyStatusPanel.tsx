import type { MonthlySpendEntry, MonthlySpendStatus } from '../../shared/domain/types'

interface MonthlyStatusPanelProps {
  entries: MonthlySpendEntry[]
  isLoading: boolean
  errorMessage: string | null
  onSetStatus: (entryId: number, status: MonthlySpendStatus) => void
}

const statusOptions: MonthlySpendStatus[] = ['Spent', 'Not Yet', 'Skip']

export function MonthlyStatusPanel({
  entries,
  isLoading,
  errorMessage,
  onSetStatus,
}: MonthlyStatusPanelProps) {
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
                <div className="dashboard-entry-row">
                  <div>
                    <p className="dashboard-entry-name">{entry.name}</p>
                    <p className="dashboard-entry-meta">
                      {entry.type} | Cost: {entry.cost} | Qty: {entry.quantity}
                    </p>
                  </div>

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
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
