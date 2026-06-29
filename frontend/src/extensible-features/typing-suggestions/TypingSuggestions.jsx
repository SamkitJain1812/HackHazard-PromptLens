import { useMemo } from 'react'

export default function TypingSuggestions({
  value,
  suggestions = [],
  onSelect,
  activeIndex = null,
}) {
  const items = useMemo(() => {
    const q = String(value || '').trim().toLowerCase()
    if (q.length < 2) return []
    const uniq = Array.from(new Set((suggestions || []).map(s => String(s))))
    return uniq
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, 6)
  }, [value, suggestions])

  if (!items.length) return null

  return (
    <div className="ts-pop">
      <div className="ts-h">Suggestions</div>
      <div className="ts-list">
        {items.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`ts-item ${activeIndex === i ? 'active' : ''}`}
            onClick={() => onSelect?.(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

