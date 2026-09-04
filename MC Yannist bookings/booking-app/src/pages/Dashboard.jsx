import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getAllBookings } from '../lib/bookings'
import ManualBookingForm from '../components/ManualBookingForm.jsx'
import BookingDetail from '../components/BookingDetail.jsx'
import Calendar from '../components/Calendar.jsx'

const money = (n) => `₦${Number(n || 0).toLocaleString()}`

const STATUS_TAG = {
  pending: { label: 'Pending', cls: 'tag-pending' },
  approved: { label: 'Booked', cls: 'tag-booked' },
  rejected: { label: 'Rejected', cls: 'tag-cancelled' },
  cancelled: { label: 'Cancelled', cls: 'tag-cancelled' },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date_asc')

  useEffect(() => {
    load()
    const link = document.querySelector('link[rel="manifest"]')
    if (link) link.setAttribute('href', '/manifest-admin.json')
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (titleMeta) titleMeta.setAttribute('content', 'MCY Admin')
  }, [])

  async function load() {
    setLoading(true)
    const rows = await getAllBookings()
    setBookings(rows)
    setLoading(false)
  }

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length
    const outstanding = bookings
      .filter((b) => b.status === 'approved')
      .reduce((s, b) => s + Math.max(b.balance, 0), 0)
    const today = todayISO()
    const in7 = addDays(today, 7)
    const upcoming = bookings.filter(
      (b) => b.status === 'approved' && b.event_date >= today && b.event_date <= in7
    ).length
    return { pending, outstanding, upcoming }
  }, [bookings])

  // Reminders — computed on load, shown as an in-app banner.
  const reminders = useMemo(() => {
    const today = todayISO()
    const in3 = addDays(today, 3)
    const in5 = addDays(today, 5)
    const pendingList = bookings.filter((b) => b.status === 'pending')
    const urgentPendingList = pendingList.filter((b) => b.event_date >= today && b.event_date <= in5)
    const otherPendingList = pendingList.filter((b) => !(b.event_date >= today && b.event_date <= in5))
    const upcomingList = bookings.filter(
      (b) => b.status === 'approved' && b.event_date >= today && b.event_date <= in3
    )
    return { pendingList, urgentPendingList, otherPendingList, upcomingList }
  }, [bookings])

  const statusByDate = useMemo(() => {
    const map = {}
    bookings.forEach((b) => {
      if (b.status === 'approved') map[b.event_date] = 'approved'
      else if (b.status === 'pending' && !map[b.event_date]) map[b.event_date] = 'pending'
    })
    return map
  }, [bookings])

  const visible = useMemo(() => {
    let rows = bookings.filter((b) => filter === 'all' || b.status === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (b) =>
          b.client_name?.toLowerCase().includes(q) ||
          b.service?.toLowerCase().includes(q) ||
          b.venue?.toLowerCase().includes(q) ||
          b.contact?.toLowerCase().includes(q)
      )
    }
    rows = [...rows].sort((a, b) => {
      if (sort === 'date_asc') return a.event_date.localeCompare(b.event_date)
      if (sort === 'date_desc') return b.event_date.localeCompare(a.event_date)
      if (sort === 'balance_desc') return (b.balance || 0) - (a.balance || 0)
      return 0
    })
    return rows
  }, [bookings, filter, search, sort])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 16px 80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24 }}>MC Yannist Bookings</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Add booking
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {(reminders.pendingList.length > 0 || reminders.upcomingList.length > 0) && (
        <div
          style={{
            background: 'var(--amber-soft)',
            border: '1px solid var(--ochre)',
            borderRadius: 4,
            padding: '14px 16px',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {reminders.urgentPendingList.length > 0 && (
            <p style={{ marginBottom: 6, color: 'var(--clay)', fontWeight: 600 }}>
              ⚠️ {reminders.urgentPendingList.length} pending request{reminders.urgentPendingList.length > 1 ? 's are' : ' is'} for an event within 5 days — still awaiting approval.
            </p>
          )}
          {reminders.otherPendingList.length > 0 && (
            <p style={{ marginBottom: reminders.upcomingList.length ? 6 : 0, color: 'var(--ochre-deep)' }}>
              ⏳ {reminders.otherPendingList.length} other request{reminders.otherPendingList.length > 1 ? 's' : ''} awaiting your approval.
            </p>
          )}
          {reminders.upcomingList.length > 0 && (
            <p style={{ color: 'var(--ochre-deep)' }}>
              📅 {reminders.upcomingList.length} booked event{reminders.upcomingList.length > 1 ? 's' : ''} coming up in the next 3 days.
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="Awaiting review" value={stats.pending} />
        <StatCard label="Outstanding balance" value={money(stats.outstanding)} accent="var(--clay)" />
        <StatCard label="Booked in 7 days" value={stats.upcoming} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={view === 'list' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          onClick={() => setView('list')}
        >
          List
        </button>
        <button
          className={view === 'calendar' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          onClick={() => setView('calendar')}
        >
          Calendar
        </button>
      </div>

      {view === 'calendar' ? (
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Calendar
            statusByDate={statusByDate}
            onSelectDate={(iso) => {
              const b = bookings.find((x) => x.event_date === iso)
              if (b) setSelected(b)
            }}
          />
          <div style={{ display: 'flex', gap: 18, marginTop: 20, fontSize: 13, color: 'var(--graphite)', flexWrap: 'wrap' }}>
            <LegendDot color="var(--sage-soft)" fg="var(--sage)" label="Open" />
            <LegendDot color="var(--amber-soft)" fg="var(--ochre-deep)" label="Pending" />
            <LegendDot color="var(--clay-soft)" fg="var(--clay)" label="Booked" />
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              placeholder="Search name, service, venue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 180 }}>
              <option value="date_asc">Date (soonest first)</option>
              <option value="date_desc">Date (latest first)</option>
              <option value="balance_desc">Balance due (highest first)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              >
                {f === 'all' ? 'All' : STATUS_TAG[f].label}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : visible.length === 0 ? (
            <p style={{ color: 'var(--graphite)' }}>No bookings here yet.</p>
          ) : (
            <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
              {visible.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr auto auto',
                    gap: 14,
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    background: i % 2 ? 'var(--paper-raised)' : 'var(--paper)',
                    border: 'none',
                    borderBottom: i < visible.length - 1 ? '1px solid var(--line)' : 'none',
                    padding: '14px 16px',
                  }}
                >
                  <span className="mono" style={{ fontSize: 13, color: 'var(--graphite)' }}>
                    {b.event_date}
                  </span>
                  <span>
                    <div style={{ fontWeight: 500 }}>{b.client_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--graphite)' }}>
                      {b.service || '—'}
                      {b.venue ? ` · ${b.venue}` : ''}
                    </div>
                  </span>
                  <span className="mono" style={{ fontSize: 14, color: b.balance > 0 ? 'var(--clay)' : 'var(--sage)' }}>
                    {b.status === 'approved' ? money(b.balance) + ' due' : ''}
                  </span>
                  <span className={`tag ${STATUS_TAG[b.status].cls}`}>{STATUS_TAG[b.status].label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <ManualBookingForm
            onCreated={() => {
              setShowForm(false)
              load()
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <BookingDetail booking={selected} onClose={() => setSelected(null)} onChanged={load} />
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 4, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, color: 'var(--graphite)', marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, color: accent || 'var(--ink)' }}>{value}</div>
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

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper-raised)',
          borderRadius: 4,
          padding: 28,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-page)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
