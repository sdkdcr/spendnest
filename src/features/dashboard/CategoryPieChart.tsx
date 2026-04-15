import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface CategoryTotal {
  type: string
  amount: number
}

interface CategoryPieChartProps {
  data: CategoryTotal[]
}

const sliceColors = [
  '#2458d3',
  '#1d8a5d',
  '#cc6b1a',
  '#8e4ec6',
  '#ce3d75',
  '#287b9e',
  '#5d6b78',
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
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
            {data.map((entry, index) => (
              <Cell
                key={`${entry.type}-${entry.amount}`}
                fill={sliceColors[index % sliceColors.length]}
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
        {data.map((entry, index) => (
          <li className="dashboard-chart-legend-item" key={entry.type}>
            <span
              className="dashboard-chart-dot"
              style={{ backgroundColor: sliceColors[index % sliceColors.length] }}
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
