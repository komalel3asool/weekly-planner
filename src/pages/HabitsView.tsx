import { Habit, AppData } from '../types'
import './HabitsView.css'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function HabitsView({ data, update }: Props) {
  const activeHabits = data.habits.filter(h => h.status === 'active')
  const pausedHabits = data.habits.filter(h => h.status === 'paused')
  const endedHabits = data.habits.filter(h => h.status === 'ended')

  const handleAddHabit = (type: 'daily' | 'weekly') => {
    const name = prompt(`New ${type} habit name:`)
    if (!name) return

    const icon = prompt('Icon (emoji):', '⭐')
    const color = confirm('Blue? (click OK for blue, Cancel for green)') ? 'blue' : 'green'
    const target = type === 'daily' ? parseInt(prompt('Target count per day:', '1') || '1') : undefined

    update(d => ({
      ...d,
      habits: [...d.habits, {
        id: `habit-${Date.now()}`,
        name,
        type,
        icon: icon || '⭐',
        color,
        status: 'active',
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        target
      }]
    }))
  }

  const handleToggleType = (habit: Habit) => {
    update(d => ({
      ...d,
      habits: d.habits.map(h => {
        if (h.id !== habit.id) return h
        const newType = h.type === 'daily' ? 'weekly' : 'daily'
        return {
          ...h,
          type: newType,
          target: newType === 'daily' ? (h.target || 1) : undefined
        }
      })
    }))
  }

  const handleSetTarget = (habit: Habit, delta: number) => {
    if (habit.type !== 'daily') return
    const newTarget = Math.max(1, (habit.target || 1) + delta)

    update(d => ({
      ...d,
      habits: d.habits.map(h => h.id === habit.id ? { ...h, target: newTarget } : h)
    }))
  }

  const handlePause = (habit: Habit) => {
    update(d => ({
      ...d,
      habits: d.habits.map(h => h.id === habit.id ? { ...h, status: 'paused', pausedAt: new Date().toISOString() } : h)
    }))
  }

  const handleResume = (habit: Habit) => {
    update(d => ({
      ...d,
      habits: d.habits.map(h => h.id === habit.id ? { ...h, status: 'active', pausedAt: undefined } : h)
    }))
  }

  const handleDelete = (habit: Habit) => {
    if (!confirm(`Delete "${habit.name}"?`)) return
    update(d => ({
      ...d,
      habits: d.habits.filter(h => h.id !== habit.id)
    }))
  }

  const HabitCard = ({ habit }: { habit: Habit }) => (
    <div className={`habit-card habit-card-${habit.type}`} style={{ '--color': `var(--${habit.color})` } as any}>
      <div className="habit-card-header">
        <div className="habit-card-title">
          <span className="habit-card-icon">{habit.icon}</span>
          <span className="habit-card-name">{habit.name}</span>
        </div>
        <span className="habit-type-badge">{habit.type}</span>
      </div>

      <div className="habit-card-info">
        <div className="streak-info">
          <div className="streak">
            <span className="streak-num">{habit.currentStreak}</span>
            <span className="streak-label">current</span>
          </div>
          <div className="streak">
            <span className="streak-num">{habit.longestStreak}</span>
            <span className="streak-label">best</span>
          </div>
        </div>
      </div>

      <div className="habit-card-actions">
        <button
          className="button-small secondary"
          onClick={() => handleToggleType(habit)}
          title={`Convert to ${habit.type === 'daily' ? 'weekly' : 'daily'}`}
        >
          {habit.type === 'daily' ? '📅 → 📋' : '📋 → 📅'}
        </button>

        {habit.type === 'daily' && (
          <div className="target-controls">
            <button
              className="button-small secondary"
              onClick={() => handleSetTarget(habit, -1)}
              title="Decrease target"
            >
              −
            </button>
            <span className="target-value">{habit.target || 1}</span>
            <button
              className="button-small secondary"
              onClick={() => handleSetTarget(habit, 1)}
              title="Increase target"
            >
              +
            </button>
          </div>
        )}

        {habit.status === 'active' && (
          <button className="button-small warning" onClick={() => handlePause(habit)}>
            ⏸ Pause
          </button>
        )}

        {habit.status === 'paused' && (
          <button className="button-small success" onClick={() => handleResume(habit)}>
            ▶ Resume
          </button>
        )}

        <button className="button-small danger" onClick={() => handleDelete(habit)}>
          ✕ Delete
        </button>
      </div>
    </div>
  )

  return (
    <div className="habits-view">
      <div className="habits-header">
        <h1>💪 Habits</h1>
        <div className="habits-actions">
          <button className="button primary" onClick={() => handleAddHabit('daily')}>
            + Daily
          </button>
          <button className="button primary" onClick={() => handleAddHabit('weekly')}>
            + Weekly
          </button>
        </div>
      </div>

      {activeHabits.length > 0 && (
        <section className="habits-section">
          <h2>Active</h2>
          <div className="habits-grid">
            {activeHabits.map(h => <HabitCard key={h.id} habit={h} />)}
          </div>
        </section>
      )}

      {pausedHabits.length > 0 && (
        <section className="habits-section paused">
          <h2>Paused</h2>
          <div className="habits-grid">
            {pausedHabits.map(h => <HabitCard key={h.id} habit={h} />)}
          </div>
        </section>
      )}

      {endedHabits.length > 0 && (
        <section className="habits-section ended">
          <h2>Ended</h2>
          <div className="habits-grid">
            {endedHabits.map(h => <HabitCard key={h.id} habit={h} />)}
          </div>
        </section>
      )}
    </div>
  )
}
