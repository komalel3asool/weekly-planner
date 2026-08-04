import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { signOut } from './lib/auth'
import { Auth } from './components/Auth'
import { useWeeklyData } from './hooks/useWeeklyData'
import { WeekData, Day } from './types'
import { Heart } from 'lucide-react'
import { ImportData } from './components/ImportData'
import { GymTracker } from './components/GymTracker'
import { TradingTracker } from './components/TradingTracker'
import { PdfReader } from './components/PdfReader'

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function getWeekKey(d = new Date()) {
  const day = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = day.getUTCDay() || 7
  day.setUTCDate(day.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function getTodayIdx() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  return dayOfWeek === 0 ? 4 : (dayOfWeek - 1) % 5
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'planner' | 'gym' | 'trading' | 'pdf'>('planner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })

    return () => {
      if (data?.subscription) data.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>
  if (!user) return <Auth onSuccess={() => {}} />
  if (view === 'trading') return <TradingTracker onBack={() => setView('planner')} />
  if (view === 'gym') return <GymTracker onBack={() => setView('planner')} />
  if (view === 'pdf') return <PdfReader onBack={() => setView('planner')} />
  return <Planner setView={setView} />
}

function Planner({ setView }: { setView: (v: any) => void }) {
  const [showImport, setShowImport] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  
  const today = new Date()
  const baseDate = new Date(today)
  baseDate.setDate(baseDate.getDate() - 7 * weekOffset)
  const weekKey = getWeekKey(baseDate)
  const { data, update } = useWeeklyData(weekKey)
  const todayIdx = getTodayIdx()
  
  const dayDates = DAYS.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (d.getDay() === 0 ? 3 : d.getDay() - 1) + i)
    return d
  })

  if (showImport) {
    return <ImportData onSuccess={() => setShowImport(false)} />
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#78350f' }}>Weekly</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setView('trading')} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>📈 Trading</button>
        <button onClick={() => setView('pdf')} style={{ padding: '0.5rem 1rem', background: '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '0.5rem' }}>📚 PDF</button>
        <button onClick={() => setView('gym')} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>💪 Gym</button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>← Prev</button>
          <button onClick={() => setWeekOffset(0)} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>This Week</button>
          <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>Next →</button>
          <button onClick={() => setShowImport(true)} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: '#fef3c7', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' }}>📥 Import</button>
          <button onClick={async () => { await signOut(); location.reload() }} style={{ padding: '0.5rem 1rem', border: '1px solid #b45309', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '3px solid #fcd34d', borderRadius: '8px', background: 'white' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Weakness Being Addressed</div>
        <input type="text" value={data.focus} onChange={(e) => update(d => ({ ...d, focus: e.target.value }))} placeholder="Enter your focus..." style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'serif', border: 'none', outline: 'none', background: 'transparent', color: '#78350f' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {DAYS.map((day, idx) => (
          <DayColumn key={day} day={day} date={dayDates[idx]} data={data} update={update} isToday={idx === todayIdx} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <HabitsSection title="Daily Routines" data={data} update={update} type="daily" />
        <HabitsSection title="Weekly Habits" data={data} update={update} type="weekly" />
      </div>

      <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#92400e' }}>Shopping List</h2>
        {data.shopping.map((item, i) => {
          const isChecked = item.startsWith('✓')
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={isChecked} onChange={() => { const arr = [...data.shopping]; arr[i] = isChecked ? item.slice(2) : '✓ ' + item; update(d => ({ ...d, shopping: arr })) }} style={{ cursor: 'pointer' }} />
              <input type="text" value={item.startsWith('✓') ? item.slice(2) : item} onChange={(e) => { const arr = [...data.shopping]; arr[i] = isChecked ? '✓ ' + e.target.value : e.target.value; update(d => ({ ...d, shopping: arr })) }} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              <button onClick={() => update(d => ({ ...d, shopping: d.shopping.filter((_, idx) => idx !== i) }))} style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
            </div>
          )
        })}
        <input type="text" placeholder="Add item..." onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as any).value) { update(d => ({ ...d, shopping: [...d.shopping, (e.target as any).value] })); (e.target as any).value = '' } }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', marginTop: '0.5rem' }} />
      </div>
    </div>
  )
}

function DayColumn({ day, date, data, update, isToday }: { day: Day; date: Date; data: WeekData; update: (fn: (d: WeekData) => WeekData) => void; isToday: boolean }) {
  return (
    <div style={{ padding: '1rem', border: isToday ? '3px solid #fcd34d' : '1px solid #ddd', borderRadius: '8px', background: isToday ? '#fffbeb' : 'white' }}>
      <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{day}</h3>
        <p style={{ fontSize: '0.75rem', color: '#666' }}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
      </div>

      {['done', 'todos', 'meetings', 'results'].map(section => (
        <ListSection key={section} section={section as any} day={day} data={data} update={update} />
      ))}
    </div>
  )
}

function ListSection({ section, day, data, update }: { section: any; day: Day; data: WeekData; update: (fn: (d: WeekData) => WeekData) => void }) {
  const items = data.lists[section][day]
  const titles = { done: 'Done', todos: 'Todos', meetings: 'Meetings', results: 'Results' }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{titles[section as keyof typeof titles]}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.25rem', fontSize: '0.85rem' }}>
            <button onClick={() => update(d => ({ ...d, lists: { ...d.lists, [section]: { ...d.lists[section], [day]: items.filter((_, idx) => idx !== i) } } }))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '0.75rem' }}>✕</button>
            <input type="text" value={item} onChange={(e) => { const list = [...items]; list[i] = e.target.value; update(d => ({ ...d, lists: { ...d.lists, [section]: { ...d.lists[section], [day]: list } } })) }} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0', fontSize: '0.85rem' }} />
          </div>
        ))}
        <input type="text" placeholder="+" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as any).value) { update(d => ({ ...d, lists: { ...d.lists, [section]: { ...d.lists[section], [day]: [...items, (e.target as any).value] } } })); (e.target as any).value = '' } }} style={{ width: '100%', padding: '0.25rem', border: '1px solid #e5e7eb', borderRadius: '2px', fontSize: '0.75rem' }} />
      </div>
    </div>
  )
}

function HabitsSection({ title, data, update, type }: { title: string; data: WeekData; update: (fn: (d: WeekData) => WeekData) => void; type: 'daily' | 'weekly' }) {
  const habits = type === 'daily' ? data.daily : data.weekly

  return (
    <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#92400e' }}>{title}</h2>
      
      {habits.map((habit, i) => (
        <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <input type="text" value={habit.name} onChange={(e) => { const arr = [...habits]; arr[i] = { ...arr[i], name: e.target.value }; update(d => type === 'daily' ? { ...d, daily: arr as any } : { ...d, weekly: arr as any }) }} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontWeight: 'bold' }} />
            <span style={{ fontSize: '0.75rem', color: '#666', minWidth: '40px' }}>Target: {habit.target}</span>
            <button onClick={() => { const arr = [...habits]; arr[i] = { ...arr[i], target: Math.max(1, habit.target - 1) }; update(d => type === 'daily' ? { ...d, daily: arr as any } : { ...d, weekly: arr as any }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>−</button>
            <button onClick={() => { const arr = [...habits]; arr[i] = { ...arr[i], target: habit.target + 1 }; update(d => type === 'daily' ? { ...d, daily: arr as any } : { ...d, weekly: arr as any }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>+</button>
            <button onClick={() => update(d => type === 'daily' ? { ...d, daily: d.daily.filter((_, idx) => idx !== i) } : { ...d, weekly: d.weekly.filter((_, idx) => idx !== i) })} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>

          {type === 'daily' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {DAYS.map(day => (
                <DailyCounter key={day} day={day} count={habit.counts[day]} target={habit.target} onChange={(v) => { const arr = [...habits]; (arr[i] as any).counts[day] = v; update(d => ({ ...d, daily: arr as any })) }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: (habit as any).target }).map((_, j) => (
                  <Heart key={j} size={16} style={{ cursor: 'pointer', fill: j < (habit as any).count ? '#f97316' : '#e5e7eb' }} onClick={() => { const arr = [...habits]; (arr[i] as any).count = j + 1; update(d => ({ ...d, weekly: arr as any })) }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>{(habit as any).count}/{(habit as any).target}</span>
            </div>
          )}
        </div>
      ))}

      <input type="text" placeholder={`Add ${type === 'daily' ? 'routine' : 'habit'}...`} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as any).value) { const newHabit = type === 'daily' ? { name: (e.target as any).value, target: 5, counts: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 } } : { name: (e.target as any).value, target: 5, count: 0 }; update(d => type === 'daily' ? { ...d, daily: [...d.daily, newHabit as any] } : { ...d, weekly: [...d.weekly, newHabit as any] }); (e.target as any).value = '' } }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
    </div>
  )
}

function DailyCounter({ day, count, target, onChange }: { day: Day; count: number; target: number; onChange: (v: number) => void }) {
  return (
    <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
      <div style={{ marginBottom: '0.25rem' }}>{day.slice(0, 3)}</div>
      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.25rem' }}>
        {Array.from({ length: target }).map((_, j) => (
          <Heart key={j} size={12} style={{ cursor: 'pointer', fill: j < count ? '#f97316' : '#e5e7eb' }} onClick={() => onChange(j + 1)} />
        ))}
      </div>
      <div style={{ color: '#666' }}>{count}/{target}</div>
    </div>
  )
}
