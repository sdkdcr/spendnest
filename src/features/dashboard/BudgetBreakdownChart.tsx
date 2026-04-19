import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface BudgetBreakdownData {
  budget: number
  spent: number
  pending: number
}

interface BudgetBreakdownChartProps {
  data: BudgetBreakdownData
  monthKey: string
}

const BUDGET_COLOR = '#4E79A7'
const SPENT_COLOR = '#2CA02C'
const PENDING_COLOR = '#FF7F0E'

function formatAxisTick(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export function BudgetBreakdownChart({ data, monthKey }: BudgetBreakdownChartProps) {
  if (data.budget === 0) {
    return <p className="families-help">No budget data for chart visualization.</p>
  }

  const chartData = [
    {
      month: monthKey,
      Budget: data.budget,
      Spent: data.spent,
      Pending: data.pending,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatAxisTick} width={52} />
        <Tooltip
          formatter={(value) => Number(value ?? 0).toFixed(2)}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        />
        <Legend />
        <Bar dataKey="Budget" fill={BUDGET_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Spent" fill={SPENT_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Pending" fill={PENDING_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
