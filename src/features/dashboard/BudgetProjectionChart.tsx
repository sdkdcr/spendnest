import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ProjectionPoint {
  monthKey: string
  total: number
}

interface BudgetProjectionChartProps {
  data: ProjectionPoint[]
  selectedMonthKey: string
}

const PROJECTION_LINE_COLOR = '#4E79A7'

function formatAxisTick(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export function BudgetProjectionChart({ data, selectedMonthKey }: BudgetProjectionChartProps) {
  if (data.every((point) => point.total === 0)) {
    return <p className="families-help">No budget data for chart visualization.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="monthKey" />
        <YAxis tickFormatter={formatAxisTick} width={52} />
        <Tooltip
          formatter={(value) => Number(value ?? 0).toFixed(2)}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={PROJECTION_LINE_COLOR}
          strokeWidth={2}
          dot={(dotProps: { cx?: number; cy?: number; payload?: ProjectionPoint }) => {
            const isSelected = dotProps.payload?.monthKey === selectedMonthKey
            return (
              <circle
                key={dotProps.payload?.monthKey}
                cx={dotProps.cx}
                cy={dotProps.cy}
                r={isSelected ? 5 : 3}
                fill={PROJECTION_LINE_COLOR}
                stroke="var(--surface)"
                strokeWidth={isSelected ? 2 : 1}
              />
            )
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
