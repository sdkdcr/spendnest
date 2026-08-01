interface BudgetTotalCardProps {
  totalAmount: number
  planCount: number
}

export function BudgetTotalCard({ totalAmount, planCount }: BudgetTotalCardProps) {
  return (
    <div className="dashboard-budget-stats">
      <div className="dashboard-budget-stat">
        <span className="dashboard-budget-stat-value">{totalAmount.toFixed(2)}</span>
        <span className="dashboard-budget-stat-label">Total Resolved Budget · {planCount}</span>
      </div>
    </div>
  )
}
