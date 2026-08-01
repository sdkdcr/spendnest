import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMonthKeyShort, getCurrentMonthKey } from '../../shared/domain/month-key'

export interface ProjectionPoint {
  monthKey: string
  total: number
}

interface BudgetProjectionChartProps {
  data: ProjectionPoint[]
  selectedMonthKey: string
}

const PROJECTION_LINE_COLOR = '#4E79A7'
const PROJECTION_BAR_COLOR = '#A7C6E8'
const CURRENT_MONTH_BAR_COLOR = '#4E79A7'

function formatAxisTick(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export function BudgetProjectionChart({ data, selectedMonthKey }: BudgetProjectionChartProps) {
  if (data.every((point) => point.total === 0)) {
    return <p className="families-help">No budget data for chart visualization.</p>
  }

  const currentMonthKey = getCurrentMonthKey()

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="monthKey" tickFormatter={formatMonthKeyShort} />
        <YAxis tickFormatter={formatAxisTick} width={52} />
        <Tooltip
          labelFormatter={(label) => formatMonthKeyShort(String(label))}
          formatter={(value) => Number(value ?? 0).toFixed(2)}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((point) => (
            <Cell
              key={point.monthKey}
              fill={point.monthKey === currentMonthKey ? CURRENT_MONTH_BAR_COLOR : PROJECTION_BAR_COLOR}
            />
          ))}
        </Bar>
        <Line
          type="monotone"
          dataKey="total"
          stroke={PROJECTION_LINE_COLOR}
          strokeWidth={2}
          dot={(dotProps: { cx?: number; cy?: number; payload?: ProjectionPoint }) => {
            const isSelected = dotProps.payload?.monthKey === selectedMonthKey
            const isCurrent = dotProps.payload?.monthKey === currentMonthKey
            return (
              <circle
                key={dotProps.payload?.monthKey}
                cx={dotProps.cx}
                cy={dotProps.cy}
                r={isSelected ? 5 : 3}
                fill={PROJECTION_LINE_COLOR}
                stroke={isCurrent ? 'var(--accent)' : 'var(--surface)'}
                strokeWidth={isSelected || isCurrent ? 2 : 1}
              />
            )
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
