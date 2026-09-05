import { useEffect, useState } from 'react'
import {
  getPayments,
  addPayment,
  deletePayment,
  updateBookingStatus,
  updateBookingDetails,
  deleteBooking,
} from '../lib/bookings'

const money = (n) => `₦${Number(n || 0).toLocaleString()}`

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function BookingDetail({ booking, onClose, onChanged }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fields, setFields] = useState({
    client_name: booking.client_name || '',
    contact: booking.contact || '',
    service: booking.service || '',
    venue: booking.venue || '',
    event_date: booking.event_date || '',
    amount_charged: booking.amount_charged || 0,
    notes: booking.notes || '',
  })
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    load()
  }, [booking.id])

  async function load() {
    setLoading(true)
    const rows = await getPayments(booking.id)
    setPayments(rows)
    setLoading(false)
  }

  const paid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const initial = Number(fields.amount_charged || 0)
  const balance = initial - paid

  async function handleAddPayment(e) {
    e.preventDefault()
    if (!payAmount) return
    setBusy(true)
    await addPayment(booking.id, { amount: Number(payAmount), method: payMethod })
    setPayAmount('')
    await load()
    onChanged()
    setBusy(false)
  }

  async function handleRemovePayment(id) {
    setBusy(true)
    await deletePayment(id)
    await load()
    onChanged()
    setBusy(false)
  }

  async function handleSaveDetails() {
    setBusy(true)
    await updateBookingDetails(booking.id, {
      client_name: fields.client_name,
      contact: fields.contact,
      service: fields.service,
      venue: fields.venue,
      event_date: fields.event_date,
      amount_charged: Number(fields.amount_charged || 0),
      notes: fields.notes,
    })
    onChanged()
    setEditing(false)
    setBusy(false)
  }

  async function handleStatus(status) {
    setBusy(true)
    await updateBookingStatus(booking.id, status)
    onChanged()
    onClose()
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this booking permanently?')) return
    setBusy(true)
    await deleteBooking(booking.id)
    onChanged()
    onClose()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          {editing ? (
            <input
              value={fields.client_name}
              onChange={(e) => setFields({ ...fields, client_name: e.target.value })}
              style={{ fontSize: 20, marginBottom: 6 }}
            />
          ) : (
            <h2 style={{ fontSize: 22 }}>{fields.client_name}</h2>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel edit' : 'Edit'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Phone or email</label>
            <input value={fields.contact} onChange={(e) => setFields({ ...fields, contact: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Service</label>
            <input value={fields.service} onChange={(e) => setFields({ ...fields, service: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Venue / location</label>
            <input value={fields.venue} onChange={(e) => setFields({ ...fields, venue: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Event date</label>
            <input
              type="date"
              value={fields.event_date}
              onChange={(e) => setFields({ ...fields, event_date: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Amount charged (₦)</label>
            <input
              type="number"
              value={fields.amount_charged}
              onChange={(e) => setFields({ ...fields, amount_charged: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea
              rows={2}
              value={fields.notes}
              onChange={(e) => setFields({ ...fields, notes: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSaveDetails} disabled={busy}>
            Save changes
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14 }}>
            {fields.event_date} · {fields.service || 'No service noted'}
          </p>
          {fields.venue && (
            <p style={{ fontSize: 14, color: 'var(--graphite)' }}>📍 {fields.venue}</p>
          )}
          {fields.contact && (
            <p style={{ fontSize: 13, color: 'var(--graphite)' }}>{fields.contact}</p>
          )}
          {fields.notes && (
            <p style={{ fontSize: 13, color: 'var(--graphite)', marginTop: 4 }}>{fields.notes}</p>
          )}
        </div>
      )}

      {booking.status === 'pending' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => handleStatus('approved')}>
            Approve
          </button>
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => handleStatus('rejected')}>
            Reject
          </button>
        </div>
      )}

      <hr className="divider" style={{ margin: '18px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <SummaryBox label="Initial amount" value={money(initial)} />
        <SummaryBox label="Paid so far" value={money(paid)} accent="var(--sage)" />
        <SummaryBox label="Balance due" value={money(balance)} accent={balance > 0 ? 'var(--clay)' : 'var(--sage)'} />
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'var(--line)',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${initial > 0 ? Math.min(100, (paid / initial) * 100) : 0}%`,
            background: 'var(--sage)',
          }}
        />
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Payment history</h3>
      {loading ? (
        <p style={{ fontSize: 14 }}>Loading…</p>
      ) : payments.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--graphite)' }}>No payments recorded yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          {payments.map((p) => (
            <li
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 14,
              }}
            >
              <span>
                {formatDateTime(p.created_at)} <span style={{ color: 'var(--graphite)' }}>· {p.method}</span>
              </span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="mono">{money(p.amount)}</span>
                <button
                  onClick={() => handleRemovePayment(p.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--clay)', fontSize: 12 }}
                >
                  remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAddPayment} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
          <label>Add payment (₦)</label>
          <input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0, width: 120 }}>
          <label>Method</label>
          <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>Add</button>
      </form>

      <hr className="divider" style={{ margin: '18px 0' }} />

      <div style={{ display: 'flex', gap: 10 }}>
        {booking.status !== 'cancelled' && (
          <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => handleStatus('cancelled')}>
            Cancel booking
          </button>
        )}
        <button className="btn btn-danger btn-sm" disabled={busy} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

function SummaryBox({ label, value, accent }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: 'var(--graphite)', marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 15, color: accent || 'var(--ink)' }}>{value}</div>
    </div>
  )
}
