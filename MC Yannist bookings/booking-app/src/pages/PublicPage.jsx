import { useEffect, useState } from 'react'
import { getPublicAvailability, submitBookingRequest } from '../lib/bookings'
import Calendar from '../components/Calendar.jsx'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function addMonths(iso, n) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

export default function PublicPage() {
  const [statusByDate, setStatusByDate] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ client_name: '', contact: '', service: '', venue: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAvailability()
  }, [])

  async function loadAvailability() {
    setLoading(true)
    try {
      const from = todayISO()
      const to = addMonths(from, 6)
      const rows = await getPublicAvailability(from, to)
      const map = {}
      rows.forEach((r) => {
        map[r.event_date] = r.status
      })
      setStatusByDate(map)
    } catch (e) {
      setError('Could not load the calendar right now.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectDate(iso, status) {
    if (status === 'approved') return
    setSelectedDate(iso)
    setSubmitted(false)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedDate) return
    setSubmitting(true)
    setError(null)
    try {
      await submitBookingRequest({ ...form, event_date: selectedDate })
      setSubmitted(true)
      setForm({ client_name: '', contact: '', service: '', venue: '', notes: '' })
      loadAvailability()
    } catch (e) {
      setError('Could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
      <header style={{ marginBottom: 40 }}>
        <p className="mono" style={{ fontSize: 13, letterSpacing: '0.02em', color: 'var(--ochre-deep)', marginBottom: 10 }}>
          MC Yannist Bookings
        </p>
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>Check a date, hold your spot</h1>
        <p style={{ fontSize: 16, maxWidth: 480 }}>
          Open dates are shown below. Pick one and send a request — you'll hear back once it's confirmed.
        </p>
      </header>

      <section
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: 24,
          marginBottom: 28,
        }}
      >
        {loading ? (
          <p>Loading calendar…</p>
        ) : (
          <>
            <Calendar
              statusByDate={statusByDate}
              onSelectDate={handleSelectDate}
              selectedDate={selectedDate}
              minDate={todayISO()}
            />
            <div style={{ display: 'flex', gap: 18, marginTop: 20, fontSize: 13, color: 'var(--graphite)', flexWrap: 'wrap' }}>
              <LegendDot color="var(--sage-soft)" fg="var(--sage)" label="Open" />
              <LegendDot color="var(--amber-soft)" fg="var(--ochre-deep)" label="Requested" />
              <LegendDot color="var(--clay-soft)" fg="var(--clay)" label="Booked" />
            </div>
          </>
        )}
      </section>

      {selectedDate && !submitted && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Request {formatLong(selectedDate)}</h2>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            This holds nothing yet — you'll be confirmed once the request is reviewed.
          </p>

          <div className="field">
            <label htmlFor="client_name">Your name</label>
            <input
              id="client_name"
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="contact">Phone or email</label>
            <input
              id="contact"
              required
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="service">What's this for?</label>
            <input
              id="service"
              placeholder="e.g. Studio session, consultation…"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="venue">Venue / location</label>
            <input
              id="venue"
              placeholder="Where's the event?"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error && <p style={{ color: 'var(--clay)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}

      {submitted && (
        <div
          style={{
            background: 'var(--sage-soft)',
            border: '1px solid var(--sage)',
            borderRadius: 4,
            padding: 20,
            color: 'var(--sage)',
          }}
        >
          Request sent for {formatLong(selectedDate)}. You'll be notified once it's confirmed.
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, fg, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, border: `1px solid ${fg}` }} />
      {label}
    </span>
  )
}

function formatLong(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
