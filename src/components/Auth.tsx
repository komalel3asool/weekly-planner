import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Auth.css'

interface Props {
  onSuccess: () => void
}

export default function Auth({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        setError('Check your email to confirm!')
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Auth error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>📅 Weekly</h1>
        <p className="auth-subtitle">Habit Tracker & Planner</p>

        <div className="auth-form">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button className="button" onClick={handleAuth} disabled={loading}>
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>

          <button
            className="button secondary"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Need account? Sign up' : 'Have account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
