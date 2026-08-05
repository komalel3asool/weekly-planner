import { DayData, Habit, TodoItem } from '../types'
import './DayCard.css'
import React, { useState } from 'react'

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
  const dailyHabits = activeHabits.filter(h => h.type === 'daily')

  const updateList = (key: keyof DayData, newList: any[]) => {
    onUpdate({ ...dayData, [key]: newList })
  }

  const addItem = (key: keyof DayData, value: string) => {
    if (!value.trim()) return
    const list = dayData[key] as any[]
    
    if (key === 'todos') {
      updateList(key, [...list, { text: value, completed: false }])
    } else {
      updateList(key, [...list, value])
    }
  }

  const removeItem = (key: keyof DayData, index: number) => {
    const list = dayData[key] as any[]
    updateList(key, list.filter((_, i) => i !== index))
  }

  const updateHabitLog = (habitId: string, count: number) => {
    const log = { ...dayData.habitLog, [habitId]: { count, notes: dayData.habitLog[habitId]?.notes || '' } }
    onUpdate({ ...dayData, habitLog: log })
  }

  const toggleTodo = (index: number) => {
    const todos = dayData.todos as TodoItem[]
    const updated = todos.map((t, i) => 
      i === index ? { ...t, completed: !t.completed } : t
    )
    updateList('todos', updated)
  }

  const exportDayData = () => {
    const date = new Date(dayData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    
    let text = `${date}\n${'='.repeat(date.length)}\n\n`

    if (dayData.done.length > 0) {
      text += `✓ DONE\n`
      dayData.done.forEach(item => {
        text += `  • ${item}\n`
      })
      text += '\n'
    }

    if (dayData.meetings.length > 0) {
      text += `📞 MEETINGS\n`
      dayData.meetings.forEach(item => {
        text += `  • ${item}\n`
      })
      text += '\n'
    }

    if (dayData.results.length > 0) {
      text += `🎯 RESULTS\n`
      dayData.results.forEach(item => {
        text += `  • ${item}\n`
      })
      text += '\n'
    }

    const incompleteTodos = (dayData.todos as TodoItem[]).filter(t => !t.completed)
    if (incompleteTodos.length > 0) {
      text += `☐ TODOS (INCOMPLETE)\n`
      incompleteTodos.forEach(item => {
        text += `  • ${item.text}\n`
      })
      text += '\n'
    }

    // Copy to clipboard and show feedback
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy. Please try again.')
    })
  }

  return (
    <div className="day-card" style={{ borderTopColor: bgColor }}>
      <div className="day-header">
        <h2>{day}</h2>
        {isToday && <span className="today-badge">Today</span>}
        <span className="day-date">{new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <button className="icon-btn export" onClick={exportDayData} title="Export day to clipboard">📋</button>
      </div>

      <Section title="✓ Done" items={dayData.done} onRemove={(i) => removeItem('done', i)} onAdd={(v) => addItem('done', v)} />
      
      <TodoSection items={dayData.todos as TodoItem[]} onRemove={(i) => removeItem('todos', i)} onAdd={(v) => addItem('todos', v)} onToggle={(i) => toggleTodo(i)} />
      
      <Section title="📞 Meetings" items={dayData.meetings} onRemove={(i) => removeItem('meetings', i)} onAdd={(v) => addItem('meetings', v)} />
      
      <Section title="🎯 Results" items={dayData.results} onRemove={(i) => removeItem('results', i)} onAdd={(v) => addItem('results', v)} />

      {dailyHabits.length > 0 && (
        <div className="habits-log">
          <h3>Habits</h3>
          {dailyHabits.map(habit => (
            <div key={habit.id} className="habit-tracker" style={{ '--color': `var(--${habit.color})` } as any}>
              <span className="habit-name">{habit.icon} {habit.name}</span>
              <div className="habit-count">
                <button onClick={() => {
                  const current = dayData.habitLog[habit.id]?.count || 0
                  updateHabitLog(habit.id, Math.max(0, current - 1))
                }}>−</button>
                <span>{dayData.habitLog[habit.id]?.count || 0}{habit.target ? ` / ${habit.target}` : ''}</span>
                <button onClick={() => {
                  const current = dayData.habitLog[habit.id]?.count || 0
                  updateHabitLog(habit.id, current + 1)
                }}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, items, onAdd, onRemove }: { title: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void }) {
  const [input, setInput] = React.useState('')

  return (
    <div className="list-section">
      <h3>{title}</h3>
      {items.length > 0 && (
        <div className="list-items">
          {items.map((item, i) => (
            <div key={i} className="list-item">
              <span>{item}</span>
              <button className="icon-btn remove" onClick={() => onRemove(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="add-item">
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
        <button className="button small" onClick={() => { onAdd(input); setInput('') }}>+</button>
      </div>
    </div>
  )
}

function TodoSection({ items, onAdd, onRemove, onToggle }: { items: TodoItem[]; onAdd: (v: string) => void; onRemove: (i: number) => void; onToggle: (i: number) => void }) {
  const [input, setInput] = React.useState('')

  return (
    <div className="list-section">
      <h3>□ Todos</h3>
      {items.length > 0 && (
        <div className="list-items">
          {items.map((item, i) => (
            <div key={i} className={`list-item todo-item ${item.completed ? 'completed' : ''}`}>
              <button className={`toggle-checkbox ${item.completed ? 'checked' : ''}`} onClick={() => onToggle(i)}>
                {item.completed ? '✓' : '○'}
              </button>
              <span className="todo-text">{item.text}</span>
              <button className="icon-btn remove" onClick={() => onRemove(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="add-item">
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
          placeholder="Add todo..."
        />
        <button className="button small" onClick={() => { onAdd(input); setInput('') }}>+</button>
      </div>
    </div>
  )
}
