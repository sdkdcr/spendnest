import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryColor } from './category-colors'

export interface CategoryTotal {
  type: string
  amount: number
}

interface CategoryPieChartProps {
  data: CategoryTotal[]
  colorByType: Record<string, string>
}

export function CategoryPieChart({ data, colorByType }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <p className="families-help">No `Spent` data for chart visualization.</p>
  }

  return (
    <div className="dashboard-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={85}
            label
          >
            {data.map((entry) => (
              <Cell
                key={`${entry.type}-${entry.amount}`}
                fill={getCategoryColor(entry.type, colorByType)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => Number(value ?? 0).toFixed(2)}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="dashboard-chart-legend">
        {data.map((entry) => (
          <li className="dashboard-chart-legend-item" key={entry.type}>
            <span
              className="dashboard-chart-dot"
              style={{ backgroundColor: getCategoryColor(entry.type, colorByType) }}
              aria-hidden="true"
            />
            <span>{entry.type}</span>
            <span>{entry.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
