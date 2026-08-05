import { WeekData, Habit } from '../types'
import './WeeklyHabits.css'

interface Props {
  week: WeekData
  habits: Habit[]
  onUpdate: (habitId: string, completed: boolean) => void
}

export default function WeeklyHabits({ week, habits, onUpdate }: Props) {
  const weeklyHabits = habits.filter(h => h.status === 'active' && h.type === 'weekly')

  if (weeklyHabits.length === 0) {
    return null
  }

  // Check if habit was completed this week (any day)
  const isCompletedThisWeek = (habitId: string) => {
    return Object.values(week.days).some(day => day.habitLog[habitId]?.count > 0)
  }

  return (
    <div className="weekly-habits-section">
      <h2 className="weekly-title">📋 Weekly Habits</h2>
      <p className="weekly-subtitle">Track your weekly commitments</p>

      <div className="weekly-habits-grid">
        {weeklyHabits.map(habit => {
          const completed = isCompletedThisWeek(habit.id)
          const streak = habit.currentStreak || 0
          const longestStreak = habit.longestStreak || 0

          return (
            <div
              key={habit.id}
              className={`weekly-habit-card ${completed ? 'completed' : ''}`}
              style={{ '--habit-color': `var(--${habit.color})` } as any}
            >
              {/* Custom Checkbox */}
              <div className="habit-checkbox-wrapper">
                <button
                  className="habit-checkbox"
                  onClick={() => onUpdate(habit.id, !completed)}
                  title={completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {completed && <span className="checkmark">✓</span>}
                </button>
              </div>

              {/* Habit Info */}
              <div className="habit-info-section">
                <div className="habit-header">
                  <span className="habit-icon">{habit.icon}</span>
                  <span className="habit-name">{habit.name}</span>
                </div>

                {/* Streak Display */}
                <div className="streak-container">
                  <div className="streak-card">
                    <div className="streak-label">Current</div>
                    <div className="streak-value">{streak}</div>
                    <div className="streak-unit">weeks</div>
                  </div>
                  
                  <div className="streak-divider"></div>
                  
                  <div className="streak-card">
                    <div className="streak-label">Best</div>
                    <div className="streak-value">{longestStreak}</div>
                    <div className="streak-unit">weeks</div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`status-badge ${completed ? 'done' : 'pending'}`}>
                {completed ? '✓ Done' : 'Pending'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
