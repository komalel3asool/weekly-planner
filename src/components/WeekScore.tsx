import { WeekData, Habit } from '../types'
import './WeekScore.css'

interface Props {
  week: WeekData
  habits: Habit[]
}

export default function WeekScore({ week, habits }: Props) {
  const activeHabits = habits.filter(h => h.status === 'active')

  // Calculate completion score
  const days = Object.values(week.days)
  const totalDays = days.length
  let completedDays = 0

  days.forEach(day => {
    const hasContent = day.done.length > 0 || day.todos.length > 0 || day.meetings.length > 0 || day.results.length > 0
    const hasHabits = activeHabits.length > 0 && activeHabits.some(h => (day.habitLog[h.id]?.count || 0) > 0)
    
    if (hasContent || hasHabits) {
      completedDays++
    }
  })

  const completionPercent = Math.round((completedDays / totalDays) * 100)

  // Calculate habit consistency
  let totalHabitCount = 0
  let totalHabitTarget = 0
  
  activeHabits.forEach(habit => {
    days.forEach(day => {
      const count = day.habitLog[habit.id]?.count || 0
      if (habit.type === 'daily') {
        totalHabitCount += Math.min(count, 1) // Count as 1 if done at least once
        totalHabitTarget += 1
      } else {
        totalHabitCount += Math.min(count, 1)
      }
    })

    if (habit.type === 'weekly') {
      totalHabitTarget += 1
      totalHabitCount += Math.min(days.reduce((sum, d) => sum + (d.habitLog[habit.id]?.count || 0), 0), 1)
    }
  })

  const habitPercent = totalHabitTarget > 0 ? Math.round((totalHabitCount / totalHabitTarget) * 100) : 0

  return (
    <div className="week-score">
      <div className="score-card">
        <div className="score-ring">
          <svg viewBox="0 0 120 120" className="ring">
            <circle cx="60" cy="60" r="50" className="ring-bg" />
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              className="ring-progress"
              style={{
                strokeDasharray: `${Math.PI * 100 * completionPercent / 100} ${Math.PI * 100}`
              }}
            />
          </svg>
          <div className="ring-text">
            <div className="ring-percent">{completionPercent}%</div>
            <div className="ring-label">This Week</div>
          </div>
        </div>
        <p className="ring-desc">{completedDays} of {totalDays} days logged</p>
      </div>

      {activeHabits.length > 0 && (
        <div className="score-card">
          <div className="score-ring">
            <svg viewBox="0 0 120 120" className="ring">
              <circle cx="60" cy="60" r="50" className="ring-bg" />
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                className="ring-progress habit"
                style={{
                  strokeDasharray: `${Math.PI * 100 * habitPercent / 100} ${Math.PI * 100}`
                }}
              />
            </svg>
            <div className="ring-text">
              <div className="ring-percent">{habitPercent}%</div>
              <div className="ring-label">Habits</div>
            </div>
          </div>
          <p className="ring-desc">{activeHabits.length} active habits</p>
        </div>
      )}
    </div>
  )
}
