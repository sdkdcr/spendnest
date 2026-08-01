import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface CategoryTotal {
  categoryId: number
  categoryName: string
  color: string
  amount: number
}

interface CategoryPieChartProps {
  data: CategoryTotal[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <p className="families-help">No budget data for chart visualization.</p>
  }

  return (
    <div className="dashboard-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={85}
            label
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
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
          <li className="dashboard-chart-legend-item" key={entry.categoryId}>
            <span
              className="dashboard-chart-dot"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span>{entry.categoryName}</span>
            <span>{entry.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
