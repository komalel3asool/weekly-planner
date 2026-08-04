import { AppData } from '../types'
import { getWeekKey, getWeekDates, getOrCreateWeek, DAYS, DAY_COLORS } from '../utils/weekUtils'
import DayCard from '../components/DayCard'
import WeekScore from '../components/WeekScore'
import './WeeklyView.css'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  weekKey: string
  weekOffset: number
  setWeekOffset: (n: number) => void
}

export default function WeeklyView({ data, update, weekKey, weekOffset, setWeekOffset }: Props) {
  const week = getOrCreateWeek(data, weekKey)
  const dates = getWeekDates(weekKey)
  const today = new Date().toISOString().split('T')[0]
  const [year, weekNum] = weekKey.split('-W').map(Number)

  return (
    <div className="weekly-view">
      <div className="week-header">
        <div className="week-info">
          <h1>Week {weekNum}</h1>
          <p className="week-range">{dates[0].date} — {dates[4].date}</p>
        </div>
        
        <div className="week-nav">
          <button className="button secondary" onClick={() => setWeekOffset(weekOffset + 1)}>← Prev</button>
          <button className="button secondary" onClick={() => setWeekOffset(0)}>Today</button>
          <button className="button secondary" onClick={() => setWeekOffset(weekOffset - 1)}>Next →</button>
        </div>
      </div>

      <WeekScore week={week} habits={data.habits} />

      <div className="focus-section">
        <input
          className="input focus-input"
          placeholder="What's your focus this week?"
          value={week.focus}
          onChange={(e) => update(d => {
            d.weeks[weekKey].focus = e.target.value
            return d
          })}
        />
      </div>

      <div className="days-grid">
        {DAYS.map(day => (
          <DayCard
            key={day}
            day={day}
            dayData={week.days[day]}
            bgColor={DAY_COLORS[day]}
            isToday={week.days[day].date === today}
            habits={data.habits}
            onUpdate={(updated) => update(d => {
              d.weeks[weekKey].days[day] = updated
              return d
            })}
          />
        ))}
      </div>
    </div>
  )
}
