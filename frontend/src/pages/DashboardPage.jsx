import { useState, useEffect, useRef, useCallback } from 'react'
import { submitQuery, getStats, getSamples, checkHealth, SESSION_STORAGE_KEY } from '../services/api'
import ChartCard from '../components/ChartCard'
import TypingSuggestions from '../extensible-features/typing-suggestions/TypingSuggestions'
import { isValidNaturalLanguageQuery } from '../extensible-features/typing-suggestions/queryValidation'
import './DashboardPage.css'

const EXAMPLE_QUERIES = [
  'Show monthly views trend over time',
  'Views by content category',
  'Compare views by region',
  'Engagement rate by category',
  'Views distribution by language',
  'Audience sentiment analysis',
  'Impact of ads on views',
  'Best video duration for views',
]

function SkeletonSection() {
  return (
    <div className="sk-wrap">
      <div className="sk-mr">
        {[0,1,2].map(i => (
          <div key={i} className="sk-mc">
            <div className="sk" style={{ width:65, height:9 }} />
            <div className="sk" style={{ width:95, height:26, marginTop:6 }} />
            <div className="sk" style={{ width:'100%', height:2, marginTop:6 }} />
            <div className="sk" style={{ width:50, height:9, marginTop:5 }} />
          </div>
        ))}
      </div>
      <div className="sk-cc">
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <div className="sk" style={{ width:160, height:13 }} />
          <div className="sk" style={{ width:100, height:13 }} />
        </div>
        <div className="sk" style={{ width:'100%', height:340, borderRadius:8 }} />
      </div>
      <div className="sk-cc" style={{ marginTop:14 }}>
        <div style={{ marginBottom:12 }}><div className="sk" style={{ width:140, height:11 }} /></div>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="sk-tr">
            {[20,24,18,16].map((w,j) => <div key={j} className="sk" style={{ width:`${w}%`, height:10 }} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage({ initialQuery, sessionId, onGoHome }) {
  const [query, setQuery]       = useState(initialQuery || '')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [stats, setStats]       = useState(null)
  const [samples, setSamples]   = useState(EXAMPLE_QUERIES)
  const [health, setHealth]     = useState(null)
  const [convHistory, setConvHistory] = useState([])
  const [animIn, setAnimIn]     = useState(false)
  const [activeChip, setActiveChip]   = useState(null)
  const [activeSug, setActiveSug] = useState(null)
  const textareaRef = useRef()

  const historyKey = `promptlens.history.${sessionId || 'default'}`

  useEffect(() => {
    Promise.all([getStats(sessionId), getSamples(), checkHealth()]).then(([s, q, h]) => {
      if (s.success) setStats(s.data)
      if (q.success && q.questions?.length) setSamples(q.questions)
      setHealth(h)
    })
    if (initialQuery) runQuery(initialQuery)
  }, [])

  // Restore history for this dataset/session (survives refresh; clears on tab close).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(historyKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setConvHistory(parsed)
    } catch {
      // ignore
    }
  }, [historyKey])

  // Best-effort cleanup: when the tab closes, ask backend to delete the uploaded dataset DB.
  useEffect(() => {
    const sid = sessionId || sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!sid) return

    const handler = () => {
      try {
        const url = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/session/close'
        navigator.sendBeacon(url, JSON.stringify({ session_id: sid }))
      } catch {
        // ignore
      }
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sessionId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [query])

  const runQuery = useCallback(async (q) => {
    const text = (q ?? query).trim()
    if (!text) return

    if (!isValidNaturalLanguageQuery(text)) {
      setLoading(false)
      setResult(null)
      setAnimIn(false)
      setError({ type:'unanswerable', msg: 'Query is not valid. Please ask a clear question in English (e.g. “Show views by region”).' })
      return
    }

    setLoading(true); setResult(null); setError(null); setAnimIn(false)

    const newHist = [...convHistory, { role:'user', content: text }]
    const data    = await submitQuery(text, sessionId, convHistory)
    setLoading(false)

    if (data.success) {
      setResult(data)
      const updated = [...newHist, { role:'model', content: JSON.stringify(data) }]
      setConvHistory(updated)
      try { sessionStorage.setItem(historyKey, JSON.stringify(updated)) } catch { /* ignore */ }
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)))
    } else if (data.answerable === false) {
      setError({ type:'unanswerable', msg: data.reason })
    } else {
      setError({ type:'server', msg: data.error })
    }
  }, [query, sessionId, convHistory])

  const handleChip = (q, index) => {
    // Toggle behavior: click again to deselect.
    if (activeChip === index) {
      setActiveChip(null)
      return
    }
    setQuery(q)
    setActiveChip(index)
    runQuery(q)
  }

  const handleSuggestion = (s) => {
    setQuery(s)
    setActiveSug(null)
    runQuery(s)
  }

  const userHistory = (convHistory || []).filter(m => m?.role === 'user' && m?.content).map(m => m.content)

  const rerunFromHistory = (text) => {
    setQuery(text)
    runQuery(text)
  }

  const clearHistory = () => {
    setConvHistory([])
    try { sessionStorage.removeItem(historyKey) } catch { /* ignore */ }
  }

  const handleReset = () => {
    setQuery(''); setResult(null); setError(null)
    setAnimIn(false); setActiveChip(null); setConvHistory([])
    setActiveSug(null)
    try { sessionStorage.removeItem(historyKey) } catch { /* ignore */ }
  }

  return (
    <div className="dash-page">

      {/* ── TOP NAV ── */}
      <header className="d-nav">
        <button
          type="button"
          className="d-logo d-logo-btn"
          onClick={() => onGoHome?.()}
          aria-label="Go to home"
          title="Home"
        >
          <span className="lt">PROMPTLENS</span><span className="ld">.</span>
        </button>
        <div className="d-nav-mid">
          <span className="d-slash">/</span>
          <span className="d-title">{result?.dashboard_title || 'Dashboard'}</span>
        </div>
        <div className="d-nav-r">
          <div className="d-pill">
            <span className={`d-dot ${health?.success ? 'online' : 'offline'}`} />
            {health?.success ? `AI · ${health.model || 'gemini-2.0-flash'}` : 'Server offline'}
          </div>
          <span className="d-date">{new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})}</span>
          {result && <button className="exp-btn">↓ EXPORT</button>}
          <button className="nq-btn" onClick={handleReset}>+ New Query</button>
        </div>
      </header>

      {/* ════════════════════════════════
          SECTION 01 — QUERY
      ════════════════════════════════ */}
      <section className="sec-query">
        <div className="sec-label">01 &nbsp; QUERY</div>

        <div className="qbox">
          <div className="q-tag">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#00b8d9" strokeWidth="1.5"/>
              <path d="M8 9l4 4-4 4M13 17h3" stroke="#00b8d9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            NATURAL LANGUAGE PROCESSOR
          </div>
          <div className="q-row">
            <span className="q-pr">&gt;</span>
            <div className="q-ta-wrap">
              <textarea
                ref={textareaRef}
                className="q-ta"
                rows={1}
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveSug(null) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runQuery() } }}
                placeholder="Ask anything about your data... e.g. Show monthly views trend"
              />
              <TypingSuggestions
                value={query}
                suggestions={samples}
                activeIndex={activeSug}
                onSelect={handleSuggestion}
              />
            </div>
            <button className="q-sb" disabled={loading || !query.trim()} onClick={() => runQuery()}>
              {loading
                ? <span className="mspin" />
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Analyze</>
              }
            </button>
          </div>
          <div className="q-cl" />
        </div>

        {/* clickable example chips */}
        <div className="q-chips">
          {samples.map((q, i) => (
            <button
              key={i}
              className={`q-chip ${activeChip === i ? 'active' : ''}`}
              onClick={() => handleChip(q, i)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* history */}
        {userHistory.length > 0 && (
          <div className="q-hist">
            <div className="q-hh">
              <div className="q-hl">History (this dataset)</div>
              <button type="button" className="q-hc" onClick={clearHistory}>Clear</button>
            </div>
            <div className="q-hl2">
              {userHistory.slice().reverse().slice(0, 8).map((h, idx) => (
                <button
                  key={`${h}-${idx}`}
                  type="button"
                  className="q-hb"
                  onClick={() => rerunFromHistory(h)}
                  title="Click to run again"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* error */}
      {!loading && error && (
        <div className={`d-err ${error.type}`}>
          <span className="err-ico">{error.type === 'unanswerable' ? '⊘' : '⚠'}</span>
          <div>
            <div className="err-t">{error.type === 'unanswerable' ? 'Cannot Answer' : 'Error'}</div>
            <div className="err-m">{error.msg}</div>
          </div>
        </div>
      )}

      {/* skeleton */}
      {loading && (
        <section className="sec-charts">
          <div className="sec-label">02 &nbsp; CHARTS</div>
          <SkeletonSection />
        </section>
      )}

      {/* ════════════════════════════════
          SECTION 02 — CHARTS
      ════════════════════════════════ */}
      {!loading && result && (
        <section className="sec-charts">
          <div className="sec-label">02 &nbsp; CHARTS</div>

          {/* dashboard header */}
          <div className="dash-hdr">
            <div>
              <div className="dash-eyebrow">DASHBOARD · REAL DATA</div>
              <div className="dash-title">{result.dashboard_title || result.title}</div>
              <div className="dash-sub">
                {stats ? `${stats.total_videos?.toLocaleString()} records · ${stats.earliest}–${stats.latest}` : '1,000,000 records · 2024–2025'}
              </div>
            </div>
            <div className="dash-badges">
              <span className="badge-type">{result.chart_type?.toUpperCase() || 'CHART'}</span>
              <span className="badge-live">LIVE</span>
            </div>
          </div>

          {/* metric cards */}
          {result.metrics?.length > 0 && (
            <div className="mc-row">
              {result.metrics.map((m, i) => (
                <div key={i} className={`mc ${animIn ? 'in' : ''}`} style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="mc-lbl">{m.label}</div>
                  <div className="mc-val">{m.value}</div>
                  <div className="mc-bar"><div className="mc-bar-f" style={{ width: `${35 + i * 20}%` }} /></div>
                  <div className="mc-d">{m.pos ? '↑' : '↓'} {m.delta}</div>
                </div>
              ))}
            </div>
          )}

          {/* charts (render all) */}
          <div className="charts-grid">
            {(result.charts || []).map((c, i) => (
              <ChartCard
                key={c.chart_id || i}
                chart={c}
                animIn={animIn}
                delayMs={240 + i * 90}
              />
            ))}
          </div>

          {/* raw table */}
          {result.charts?.find?.(c => c?.data?.length) && (
            <div className={`raw-card ${animIn ? 'in' : ''}`} style={{ transitionDelay:'380ms' }}>
              <div className="raw-h">
                <span className="raw-lbl">Raw Source Data: <span className="raw-src">query_result</span></span>
                <span className="raw-cnt">{result.charts.find(c => c?.data?.length).data.length} rows</span>
              </div>
              <div className="raw-scroll">
                <table className="rt">
                  <thead>
                    <tr>
                      {Object.keys(result.charts.find(c => c?.data?.length).data[0] || {}).map(col => (
                        <th key={col}>{col.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.charts.find(c => c?.data?.length).data.slice(0, 6).map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k}>
                            {typeof v === 'number'
                              ? <span className="nv">{v > 999 ? v.toLocaleString() : v}</span>
                              : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ════════════════════════════════
          SECTION 03 — AI INSIGHTS
      ════════════════════════════════ */}
      {!loading && result?.insight && (
        <section className="sec-insights">
          <div className="sec-label">03 &nbsp; AI INSIGHTS</div>
          <div className="ins-grid">
            {/* Gemini-generated insight spans full width */}
            <div className={`ins-card primary ${animIn ? 'in' : ''}`} style={{ transitionDelay:'480ms' }}>
              <div className="ins-brow"><span className="ins-bul" />GEMINI ANALYSIS</div>
              <div className="ins-txt">{result.insight}</div>
            </div>
            {/* static contextual insights */}
            <div className={`ins-card warning ${animIn ? 'in' : ''}`} style={{ transitionDelay:'560ms' }}>
              <div className="ins-brow"><span className="ins-bul" />DATA COVERAGE</div>
              <div className="ins-txt">
                Query processed across <span className="hl-y">{stats?.total_videos?.toLocaleString() || '1,000,000'} records</span> spanning{' '}
                {stats?.earliest || '2024-01'} to {stats?.latest || '2025-12'} —{' '}
                {stats?.categories || 6} categories, {stats?.regions || 5} regions, {stats?.languages || 5} languages.
              </div>
            </div>
            <div className={`ins-card alert ${animIn ? 'in' : ''}`} style={{ transitionDelay:'640ms' }}>
              <div className="ins-brow"><span className="ins-bul" />NEXT STEPS</div>
              <div className="ins-txt">
                Try a <span className="hl-r">follow-up query</span> to drill deeper —
                filter by region, compare time periods, or segment by category for more granular insights.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* empty state */}
      {!loading && !result && !error && (
        <div className="empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ opacity:.12 }}>
            <circle cx="11" cy="11" r="8" stroke="#445577" strokeWidth="1.5"/>
            <path d="M21 21l-5-5" stroke="#445577" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="em-t">No dashboard yet</div>
          <div className="em-s">Type a question above or click one of the example chips to instantly generate a live dashboard</div>
        </div>
      )}
    </div>
  )
}
