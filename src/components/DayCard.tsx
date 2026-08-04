import { DayData, Habit } from '../types'
import './DayCard.css'

interface Props {
  day: string
  dayData: DayData
  bgColor: string
  isToday: boolean
  habits: Habit[]
  onUpdate: (data: DayData) => void
}

export default function DayCard({ day, dayData, bgColor, isToday, habits, onUpdate }: Props) {
  const activeHabits = habits.filter(h => h.status === 'active')

  const updateList = (key: keyof DayData, newList: string[]) => {
    onUpdate({ ...dayData, [key]: newList })
  }

  const addItem = (key: keyof DayData, value: string) => {
    if (!value.trim()) return
    const list = dayData[key] as string[]
    updateList(key, [...list, value])
  }

  const removeItem = (key: keyof DayData, index: number) => {
    const list = dayData[key] as string[]
    updateList(key, list.filter((_, i) => i !== index))
  }

  const updateHabitLog = (habitId: string, count: number) => {
    const log = { ...dayData.habitLog, [habitId]: { count, notes: dayData.habitLog[habitId]?.notes || '' } }
    onUpdate({ ...dayData, habitLog: log })
  }

  const toggleTodo = (index: number) => {
    const todo = dayData.todos[index]
    const done = dayData.done
    updateList('done', [...done, todo])
    removeItem('todos', index)
  }

  return (
    <div className="day-card" style={{ borderTopColor: bgColor }}>
      <div className="day-header">
        <h2>{day}</h2>
        {isToday && <span className="today-badge">Today</span>}
        <span className="day-date">{new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>

      <Section title="✓ Done" items={dayData.done} onRemove={(i) => removeItem('done', i)} onAdd={(v) => addItem('done', v)} />
      
      <Section title="□ Todos" items={dayData.todos} onRemove={(i) => removeItem('todos', i)} onAdd={(v) => addItem('todos', v)} onToggle={(i) => toggleTodo(i)} />
      
      <Section title="📞 Meetings" items={dayData.meetings} onRemove={(i) => removeItem('meetings', i)} onAdd={(v) => addItem('meetings', v)} />
      
      <Section title="🎯 Results" items={dayData.results} onRemove={(i) => removeItem('results', i)} onAdd={(v) => addItem('results', v)} />

      {activeHabits.length > 0 && (
        <div className="habits-log">
          <h3>Habits</h3>
          {activeHabits.map(habit => (
            <div key={habit.id} className="habit-tracker" style={{ '--color': `var(--${habit.color})` } as any}>
              <span className="habit-name">{habit.icon} {habit.name}</span>
              <div className="habit-count">
                <button onClick={() => updateHabitLog(habit.id, Math.max(0, (dayData.habitLog[habit.id]?.count || 0) - 1))}>−</button>
                <span>{dayData.habitLog[habit.id]?.count || 0}</span>
                <button onClick={() => updateHabitLog(habit.id, (dayData.habitLog[habit.id]?.count || 0) + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, items, onAdd, onRemove, onToggle }: { title: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; onToggle?: (i: number) => void }) {
  const [input, setInput] = React.useState('')

  return (
    <div className="section">
      <h3>{title}</h3>
      {items.map((item, i) => (
        <div key={i} className="item">
          {onToggle && <button className="toggle" onClick={() => onToggle(i)}>✓</button>}
          <span>{item}</span>
          <button className="remove" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <div className="input-row">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(input)
              setInput('')
            }
          }}
          placeholder={`Add ${title.toLowerCase()}...`}
        />
      </div>
    </div>
  )
}

import React from 'react'
