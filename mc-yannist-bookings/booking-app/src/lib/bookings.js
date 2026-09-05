import { supabase } from './supabaseClient'
import { notifyNewBooking } from './notifications'

/* ---------- Public (no auth) ---------- */

// Returns only date + status — never client details or amounts.
// Reads from the `public_availability` view (see supabase-schema.sql),
// which is the only thing anonymous visitors can select from.
export async function getPublicAvailability(fromDate, toDate) {
  const { data, error } = await supabase
    .from('public_availability')
    .select('event_date, status')
    .gte('event_date', fromDate)
    .lte('event_date', toDate)
  if (error) throw error
  return data
}

export async function submitBookingRequest({
  client_name,
  contact,
  service,
  event_date,
  venue,
  notes,
}) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        client_name,
        contact,
        service,
        event_date,
        venue,
        notes,
        status: 'pending',
        source: 'client',
      },
    ])
    .select()
    .single()
  if (error) throw error
  notifyNewBooking(data) // fire-and-forget — never blocks the client's submission
  return data
}

/* ---------- Vendor dashboard (auth required — RLS enforced) ---------- */

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, payments(amount)')
    .order('event_date', { ascending: true })
  if (error) throw error
  return data.map(withBalance)
}

export async function createManualBooking({
  client_name,
  contact,
  service,
  event_date,
  venue,
  amount_charged,
  notes,
  first_payment,
}) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        client_name,
        contact,
        service,
        event_date,
        venue,
        amount_charged: amount_charged || 0,
        notes,
        status: 'approved',
        source: 'vendor',
      },
    ])
    .select()
    .single()
  if (error) throw error

  if (first_payment && Number(first_payment) > 0) {
    await addPayment(data.id, {
      amount: Number(first_payment),
      method: 'cash',
      note: 'Initial payment',
    })
  }
  return data
}

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Full edit — client name, contact, service, venue, date, notes, amount.
// Any field left out of `fields` is left unchanged.
export async function updateBookingDetails(id, fields) {
  const { data, error } = await supabase
    .from('bookings')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBookingAmount(id, amount_charged) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ amount_charged })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBooking(id) {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

export async function getPayments(bookingId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('paid_on', { ascending: true })
  if (error) throw error
  return data
}

export async function addPayment(bookingId, { amount, method, note, paid_on }) {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        booking_id: bookingId,
        amount,
        method: method || 'cash',
        note,
        paid_on: paid_on || new Date().toISOString().slice(0, 10),
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePayment(id) {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw error
}

/* ---------- helpers ---------- */

function withBalance(booking) {
  const paid = (booking.payments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  return {
    ...booking,
    amount_paid: paid,
    balance: Number(booking.amount_charged || 0) - paid,
  }
}
