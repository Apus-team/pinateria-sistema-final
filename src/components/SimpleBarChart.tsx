interface BarItem {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: BarItem[]
  maxValue?: number
  formatValue?: (v: number) => string
}

export default function SimpleBarChart({ data, maxValue, formatValue }: SimpleBarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const pct = Math.max((item.value / max) * 100, 1)
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-500">{formatValue ? formatValue(item.value) : item.value}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: item.color ?? '#a855f7' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
