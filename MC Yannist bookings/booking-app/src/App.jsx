import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import PublicPage from './pages/PublicPage.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route
        path="/admin/login"
        element={
          session ? <Navigate to="/admin" replace /> : <Login />
        }
      />
      <Route
        path="/admin"
        element={
          session === undefined ? (
            <div style={{ padding: 40 }}>Loading…</div>
          ) : session ? (
            <Dashboard />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
    </Routes>
  )
}
