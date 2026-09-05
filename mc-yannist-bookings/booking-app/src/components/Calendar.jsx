import { useMemo, useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toISODate(y, m, d) {
  const mm = String(m + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

// statusByDate: { 'YYYY-MM-DD': 'available' | 'pending' | 'approved' }
export default function Calendar({ statusByDate = {}, onSelectDate, selectedDate, minDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const out = []
    for (let i = 0; i < firstDay; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(d)
    return out
  }, [viewYear, viewMonth])

  function changeMonth(delta) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setViewMonth(m)
    setViewYear(y)
  }

  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <button className="btn btn-outline btn-sm" onClick={() => changeMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <h3 style={{ fontSize: 20 }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button className="btn btn-outline btn-sm" onClick={() => changeMonth(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 12, color: 'var(--graphite)' }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />
          const iso = toISODate(viewYear, viewMonth, day)
          const status = statusByDate[iso] || 'available'
          const isPast = minDate ? iso < minDate : false
          const isSelected = selectedDate === iso
          const isToday = iso === todayISO

          const colors = {
            available: { bg: 'var(--sage-soft)', fg: 'var(--sage)' },
            pending: { bg: 'var(--amber-soft)', fg: 'var(--ochre-deep)' },
            approved: { bg: 'var(--clay-soft)', fg: 'var(--clay)' },
          }[status]

          return (
            <button
              key={iso}
              disabled={isPast || status === 'approved'}
              onClick={() => onSelectDate && onSelectDate(iso, status)}
              title={status}
              style={{
                aspectRatio: '1',
                border: isSelected ? '2px solid var(--ink)' : isToday ? '1px solid var(--ink)' : '1px solid var(--line)',
                borderRadius: 4,
                background: isPast ? 'var(--paper)' : colors.bg,
                color: isPast ? 'var(--graphite)' : colors.fg,
                opacity: isPast ? 0.4 : 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                cursor: isPast || status === 'approved' ? 'default' : 'pointer',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
