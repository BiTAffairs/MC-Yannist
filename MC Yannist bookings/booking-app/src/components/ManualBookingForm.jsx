import { useState } from 'react'
import { createManualBooking } from '../lib/bookings'

export default function ManualBookingForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    client_name: '',
    contact: '',
    service: '',
    event_date: '',
    venue: '',
    amount_charged: '',
    first_payment: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createManualBooking(form)
      onCreated()
    } catch (err) {
      setError('Could not save this booking.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>Add a booking</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label>Client name</label>
          <input
            required
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Phone or email</label>
          <input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            required
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Service</label>
          <input
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label>Amount charged (₦)</label>
          <input
            type="number"
            min="0"
            value={form.amount_charged}
            onChange={(e) => setForm({ ...form, amount_charged: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Payment received now (₦)</label>
          <input
            type="number"
            min="0"
            value={form.first_payment}
            onChange={(e) => setForm({ ...form, first_payment: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label>Venue / location</label>
        <input
          placeholder="e.g. Crown Height Pavilion, Benin City"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {error && <p style={{ color: 'var(--clay)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save booking'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
