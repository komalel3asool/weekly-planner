import { useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { getWeekKey } from './utils/weekUtils'
import WeeklyView from './pages/WeeklyView'
import TradingView from './pages/TradingView'
import PdfView from './pages/PdfView'
import HabitsView from './pages/HabitsView'
import './App.css'

type View = 'weekly' | 'trading' | 'pdf' | 'habits'

export default function App() {
  const { data, update } = useAppData()
  const [view, setView] = useState<View>('weekly')
  const [weekOffset, setWeekOffset] = useState(0)

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
        </div>
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
