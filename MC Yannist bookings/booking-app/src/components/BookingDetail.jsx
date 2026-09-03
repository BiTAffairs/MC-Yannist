import { useEffect, useState } from 'react'
import {
  getPayments,
  addPayment,
  deletePayment,
  updateBookingStatus,
  updateBookingAmount,
  deleteBooking,
} from '../lib/bookings'

const money = (n) => `₦${Number(n || 0).toLocaleString()}`

export default function BookingDetail({ booking, onClose, onChanged }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(booking.amount_charged || 0)
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
  const balance = Number(amount || 0) - paid

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

  async function handleSaveAmount() {
    setBusy(true)
    await updateBookingAmount(booking.id, Number(amount))
    onChanged()
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22 }}>{booking.client_name}</h2>
          <p style={{ fontSize: 14 }}>
            {booking.event_date} · {booking.service || 'No service noted'}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
      </div>

      {booking.contact && (
        <p style={{ fontSize: 13, color: 'var(--graphite)', marginBottom: 16 }}>{booking.contact}</p>
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

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label>Amount charged</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleSaveAmount} disabled={busy}>
          Save
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 4 }}>
        <span>Paid so far</span>
        <span className="mono">{money(paid)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
        <span>Balance</span>
        <span className="mono" style={{ color: balance > 0 ? 'var(--clay)' : 'var(--sage)' }}>
          {money(balance)}
        </span>
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
                {p.paid_on} <span style={{ color: 'var(--graphite)' }}>· {p.method}</span>
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

      <form onSubmit={handleAddPayment} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
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
