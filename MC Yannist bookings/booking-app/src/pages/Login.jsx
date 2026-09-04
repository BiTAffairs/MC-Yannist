import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]')
    if (link) link.setAttribute('href', '/manifest-admin.json')
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (titleMeta) titleMeta.setAttribute('content', 'MCY Admin')
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: '32px 28px',
          boxShadow: 'var(--shadow-page)',
        }}
      >
        <img src="/icon-192.png" alt="MC Yannist" style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>MC Yannist Bookings</h1>
        <p style={{ marginBottom: 24, fontSize: 14 }}>
          Sign in to manage your bookings.
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--clay)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
