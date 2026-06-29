import { useMemo, useState } from 'react'

export default function QueryExplainer({ sql }) {
  const [open, setOpen] = useState(false)

  const cleaned = useMemo(() => {
    if (!sql) return ''
    return String(sql).trim()
  }, [sql])

  if (!cleaned) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(cleaned)
    } catch {
      // ignore
    }
  }

  return (
    <div className="qe">
      <button className="qe-btn" type="button" onClick={() => setOpen(v => !v)}>
        How was this generated?
        <span className={`qe-caret ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="qe-panel">
          <div className="qe-ph">
            <span className="qe-ttl">SQL</span>
            <button className="qe-copy" type="button" onClick={copy}>Copy</button>
          </div>
          <pre className="qe-pre"><code>{cleaned}</code></pre>
        </div>
      )}
    </div>
  )
}

