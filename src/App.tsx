import { useState, useEffect } from 'react'
import { useAppData } from './hooks/useAppData'
import { getWeekKey } from './utils/weekUtils'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import WeeklyView from './pages/WeeklyView'
import TradingView from './pages/TradingView'
import PdfView from './pages/PdfView'
import HabitsView from './pages/HabitsView'
import './App.css'

type View = 'weekly' | 'trading' | 'pdf' | 'habits'

export default function App() {
  const { data, loading, update, userId } = useAppData()
  const [view, setView] = useState<View>('weekly')
  const [weekOffset, setWeekOffset] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (!isAuthenticated) {
    return <Auth onSuccess={() => window.location.reload()} />
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading your data...</p>
      </div>
    )
  }

  const today = new Date()
  const baseDate = new Date(today)
  baseDate.setDate(baseDate.getDate() - 7 * weekOffset)
  const weekKey = getWeekKey(baseDate)

  const getIcon = (v: View) => {
    const icons: Record<View, string> = {
      weekly: '📅',
      trading: '📈',
      pdf: '📚',
      habits: '⚡'
    }
    return icons[v]
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }

  return (
    <div className="app">
      <div className="nav-bar">
        <div className="nav-title">Weekly</div>
        <div className="nav-buttons">
          {(['weekly', 'habits', 'trading', 'pdf'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`nav-btn ${view === v ? 'active' : ''}`}
              title={v}
            >
              {getIcon(v)}
            </button>
          ))}
          <button className="nav-btn" onClick={() => setShowMenu(!showMenu)} title="menu">
            ⋮
          </button>
        </div>
        {showMenu && (
          <div className="menu-dropdown">
            <button onClick={handleLogout} className="menu-item">Sign Out</button>
          </div>
        )}
      </div>

      <main className="main-content">
        {view === 'weekly' && <WeeklyView data={data} update={update} weekKey={weekKey} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />}
        {view === 'trading' && <TradingView data={data} update={update} />}
        {view === 'pdf' && <PdfView data={data} update={update} />}
        {view === 'habits' && <HabitsView data={data} update={update} />}
      </main>
    </div>
  )
}
