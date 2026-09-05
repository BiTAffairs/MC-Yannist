// Client-side notifications — no backend server required.
//
// EMAIL uses EmailJS (https://www.emailjs.com) — free tier, sends straight
// from the browser using a public key (safe to expose).
//
// WHATSAPP uses CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
// — free tier, also callable straight from the browser.
//
// Both are optional: if the env vars below aren't set, sending is silently
// skipped so the app still works without them configured.

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

const CALLMEBOT_PHONE = import.meta.env.VITE_CALLMEBOT_PHONE
const CALLMEBOT_APIKEY = import.meta.env.VITE_CALLMEBOT_APIKEY

export async function sendAdminEmail(subject, message) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !ADMIN_EMAIL) return
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: ADMIN_EMAIL,
          subject,
          message,
        },
      }),
    })
  } catch (e) {
    console.error('Email notification failed', e)
  }
}

export async function sendAdminWhatsApp(message) {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) return
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(
      message
    )}&apikey=${CALLMEBOT_APIKEY}`
    await fetch(url)
  } catch (e) {
    console.error('WhatsApp notification failed', e)
  }
}

export async function notifyNewBooking(booking) {
  const subject = `New booking request — ${booking.client_name}`
  const message =
    `New booking request\n` +
    `Client: ${booking.client_name}\n` +
    `Date: ${booking.event_date}\n` +
    `Service: ${booking.service || '—'}\n` +
    `Venue: ${booking.venue || '—'}\n` +
    `Contact: ${booking.contact || '—'}`
  await Promise.all([sendAdminEmail(subject, message), sendAdminWhatsApp(message)])
}
