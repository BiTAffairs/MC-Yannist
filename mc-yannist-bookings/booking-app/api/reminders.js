// Runs once a day via Vercel Cron (see vercel.json).
// Checks for APPROVED bookings whose event is exactly 2 days away, 1 day away,
// or today, and sends the admin an email + WhatsApp reminder for each.
//
// Uses the Supabase SERVICE ROLE key (server-side only, never exposed to the
// browser) so it can read full booking details regardless of RLS policies.

function todayISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

async function fetchBookingsForDate(dateISO) {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/bookings?select=*&status=eq.approved&event_date=eq.${dateISO}`
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) return []
  return res.json()
}

async function sendEmail(subject, message) {
  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_ADMIN_EMAIL } = process.env
  if (!VITE_EMAILJS_SERVICE_ID || !VITE_EMAILJS_TEMPLATE_ID || !VITE_EMAILJS_PUBLIC_KEY || !VITE_ADMIN_EMAIL) return
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: VITE_EMAILJS_SERVICE_ID,
        template_id: VITE_EMAILJS_TEMPLATE_ID,
        user_id: VITE_EMAILJS_PUBLIC_KEY,
        template_params: { to_email: VITE_ADMIN_EMAIL, subject, message },
      }),
    })
  } catch (e) {
    console.error('Reminder email failed', e)
  }
}

async function sendWhatsApp(message) {
  const { VITE_CALLMEBOT_PHONE, VITE_CALLMEBOT_APIKEY } = process.env
  if (!VITE_CALLMEBOT_PHONE || !VITE_CALLMEBOT_APIKEY) return
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(
      message
    )}&apikey=${VITE_CALLMEBOT_APIKEY}`
    await fetch(url)
  } catch (e) {
    console.error('Reminder WhatsApp failed', e)
  }
}

async function remindFor(dateISO, label) {
  const bookings = await fetchBookingsForDate(dateISO)
  for (const b of bookings) {
    const message =
      `Reminder — event ${label}\n` +
      `Client: ${b.client_name}\n` +
      `Date: ${b.event_date}\n` +
      `Service: ${b.service || '—'}\n` +
      `Venue: ${b.venue || '—'}\n` +
      `Contact: ${b.contact || '—'}`
    await Promise.all([sendEmail(`Event ${label} — ${b.client_name}`, message), sendWhatsApp(message)])
  }
  return bookings.length
}

export default async function handler(req, res) {
  // Vercel Cron calls this with a special header — reject other callers.
  const isCron = req.headers['x-vercel-cron'] || req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`
  if (process.env.CRON_SECRET && !isCron) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const results = {}
  results.in2days = await remindFor(todayISO(2), 'in 2 days')
  results.tomorrow = await remindFor(todayISO(1), 'tomorrow')
