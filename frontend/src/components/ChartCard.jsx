import ChartRenderer from './ChartRenderer'
import QueryExplainer from '../extensible-features/query-explainer/QueryExplainer'

function normalizeChartType(chartType) {
  const t = String(chartType || '').toLowerCase().trim()
  if (['line', 'bar', 'pie', 'area'].includes(t)) return t
  if (t === 'scatter') return 'bar'
  return 'bar'
}

function buildSeries(chart) {
  const rows = Array.isArray(chart?.data) ? chart.data : []
  if (!rows.length || typeof rows[0] !== 'object' || rows[0] == null) {
    return { labels: [], values: [], name: '' }
  }

  let xKey = (chart?.x_key || '').trim()
  const yKeys = Array.isArray(chart?.y_keys) ? chart.y_keys : []
  let yKey = yKeys[0] || ''

  const first = rows[0] || {}

  if (!xKey || first[xKey] === undefined) {
    xKey = Object.keys(first)[0] || ''
  }
  if (!yKey || first[yKey] === undefined) {
    const candidates = Object.keys(first).filter(k => k !== xKey)
    yKey = candidates[0] || ''
  }

  const labels = []
  const values = []
  for (const r of rows) {
    if (!r) continue
    labels.push(r[xKey])
    const v = r[yKey]
    if (typeof v === 'number') values.push(v)
    else if (v == null) values.push(0)
    else {
      const n = Number(v)
      values.push(Number.isFinite(n) ? n : 0)
    }
  }

  return { labels, values, name: yKey || 'Value' }
}

export default function ChartCard({ chart, animIn = false, delayMs = 0 }) {
  if (!chart) return null

  if (chart.error) {
    return (
      <div className={`chart-card ${animIn ? 'in' : ''}`} style={{ transitionDelay: `${delayMs}ms` }}>
        <div className="chart-card-h">
          <span className="chart-card-t">{chart.title || chart.chart_id || 'Chart'}</span>
        </div>
        <div className="chart-err">
          <div className="chart-err-t">Chart failed</div>
          <div className="chart-err-m">{chart.error}</div>
        </div>
        <QueryExplainer sql={chart.sql} />
      </div>
    )
  }

  const { labels, values, name } = buildSeries(chart)
  const chartType = normalizeChartType(chart.chart_type)

  return (
    <div className={`chart-card ${animIn ? 'in' : ''}`} style={{ transitionDelay: `${delayMs}ms` }}>
      <div className="chart-card-h">
        <span className="chart-card-t">{chart.title || chart.chart_id || 'Chart'}</span>
        <div className="chart-leg">
          {labels.slice(0, 5).map((l, i) => (
            <span key={i} className="lg-i">
              <span className="lg-d" style={{ background: ['#00b8d9', '#f5a623', '#e63946', '#22c55e', '#a78bfa'][i] }} />
              {String(l)}
            </span>
          ))}
        </div>
      </div>

      <ChartRenderer
        chartType={chartType}
        labels={labels}
        data={values}
        name={name}
      />

      <QueryExplainer sql={chart.sql} />
    </div>
  )
}

