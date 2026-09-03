import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getAllBookings } from '../lib/bookings'
import ManualBookingForm from '../components/ManualBookingForm.jsx'
import BookingDetail from '../components/BookingDetail.jsx'

const money = (n) => `₦${Number(n || 0).toLocaleString()}`

const STATUS_TAG = {
  pending: { label: 'Pending', cls: 'tag-pending' },
  approved: { label: 'Booked', cls: 'tag-booked' },
  rejected: { label: 'Rejected', cls: 'tag-cancelled' },
  cancelled: { label: 'Cancelled', cls: 'tag-cancelled' },
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    load()
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
    const today = new Date().toISOString().slice(0, 10)
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const upcoming = bookings.filter(
      (b) => b.status === 'approved' && b.event_date >= today && b.event_date <= in7
    ).length
    return { pending, outstanding, upcoming }
  }, [bookings])

  const visible = bookings.filter((b) => filter === 'all' || b.status === filter)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26 }}>MC Yannist Bookings</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Add booking
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        <StatCard label="Awaiting review" value={stats.pending} />
        <StatCard label="Outstanding balance" value={money(stats.outstanding)} accent="var(--clay)" />
        <StatCard label="Booked in 7 days" value={stats.upcoming} />
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
                <div style={{ fontSize: 13, color: 'var(--graphite)' }}>{b.service || '—'}</div>
              </span>
              <span className="mono" style={{ fontSize: 14, color: b.balance > 0 ? 'var(--clay)' : 'var(--sage)' }}>
                {b.status === 'approved' ? money(b.balance) + ' due' : ''}
              </span>
              <span className={`tag ${STATUS_TAG[b.status].cls}`}>{STATUS_TAG[b.status].label}</span>
            </button>
          ))}
        </div>
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
      <div className="mono" style={{ fontSize: 24, color: accent || 'var(--ink)' }}>{value}</div>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(36, 31, 26, 0.45)',
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
