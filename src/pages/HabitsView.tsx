import { AppData, Habit, Color } from '../types'
import { generateId } from '../utils/id'
import './HabitsView.css'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

const COLORS: Color[] = ['red', 'blue', 'green', 'orange', 'purple', 'pink', 'cyan', 'yellow']
const ICONS = ['🎯', '💪', '📚', '🧘', '🏃', '🍎', '💧', '😴', '📝', '🚀']

export default function HabitsView({ data, update }: Props) {
  const activeHabits = data.habits.filter(h => h.status === 'active')
  const pausedHabits = data.habits.filter(h => h.status === 'paused')
  const endedHabits = data.habits.filter(h => h.status === 'ended')

  const addHabit = (name: string, type: 'daily' | 'weekly') => {
    if (!name.trim()) return
    
    const newHabit: Habit = {
      id: generateId(),
      name,
      type,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      status: 'active',
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0
    }
    
    update(d => ({
      ...d,
      habits: [...d.habits, newHabit]
    }))
  }

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    update(d => ({
      ...d,
      habits: d.habits.map(h => h.id === id ? { ...h, ...updates } : h)
    }))
  }

  const deleteHabit = (id: string) => {
    update(d => ({
      ...d,
      habits: d.habits.filter(h => h.id !== id)
    }))
  }

  return (
    <div className="habits-view">
      <div className="habits-header">
        <h1>Habits</h1>
        <NewHabitForm onAdd={addHabit} />
      </div>

      {activeHabits.length > 0 && (
        <Section title="Active" habits={activeHabits} onUpdate={updateHabit} onDelete={deleteHabit} />
      )}

      {pausedHabits.length > 0 && (
        <Section title="Paused" habits={pausedHabits} onUpdate={updateHabit} onDelete={deleteHabit} />
      )}

      {endedHabits.length > 0 && (
        <Section title="Ended" habits={endedHabits} onUpdate={updateHabit} onDelete={deleteHabit} />
      )}
    </div>
  )
}

function NewHabitForm({ onAdd }: { onAdd: (name: string, type: 'daily' | 'weekly') => void }) {
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<'daily' | 'weekly'>('daily')

  const handleSubmit = () => {
    onAdd(name, type)
    setName('')
  }

  return (
    <div className="new-habit-form">
      <input
        className="input"
        placeholder="New habit..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
        <option>daily</option>
        <option>weekly</option>
      </select>
      <button className="button" onClick={handleSubmit}>Add</button>
    </div>
  )
}

function Section({ title, habits, onUpdate, onDelete }: { title: string; habits: Habit[]; onUpdate: (id: string, u: Partial<Habit>) => void; onDelete: (id: string) => void }) {
  return (
    <div className="habits-section">
      <h2>{title}</h2>
      <div className="habits-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-card" style={{ '--card-color': `var(--${habit.color})` } as any}>
            <div className="habit-info">
              <div className="habit-icon">{habit.icon}</div>
              <div className="habit-details">
                <div className="habit-name">{habit.name}</div>
                <div className="habit-meta">{habit.type} • Streak: {habit.currentStreak}</div>
              </div>
            </div>
            <div className="habit-actions">
              {habit.status === 'active' && (
                <button className="icon-btn" onClick={() => onUpdate(habit.id, { status: 'paused' })}>⏸</button>
              )}
              {habit.status === 'paused' && (
                <button className="icon-btn" onClick={() => onUpdate(habit.id, { status: 'active' })}>▶</button>
              )}
              <button className="icon-btn delete" onClick={() => onDelete(habit.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
