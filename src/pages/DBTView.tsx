import { AppData, DBTEntry } from '../types'
import { generateId } from '../utils/id'
import { supabase } from '../lib/supabase'
import './DBTView.css'
import React, { useState } from 'react'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function DBTView({ data, update }: Props) {
  const entries = data.dbtEntries
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = entries.find(e => e.date === today)
  const [uploading, setUploading] = useState(false)

  const addOrUpdateEntry = (entry: Partial<DBTEntry>) => {
    if (todayEntry) {
      // Update existing
      update(d => ({
        ...d,
        dbtEntries: d.dbtEntries.map(e => 
          e.id === todayEntry.id ? { ...e, ...entry } : e
        )
      }))
    } else {
      // Create new
      const newEntry: DBTEntry = {
        id: generateId(),
        date: today,
        mood: 5,
        skills: {
          mindfulness: false,
          distressTolerance: false,
          emotionRegulation: false,
          interpersonalEffectiveness: false
        },
        notes: '',
        createdAt: new Date().toISOString(),
        ...entry
      }
      update(d => ({
        ...d,
        dbtEntries: [newEntry, ...d.dbtEntries]
      }))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!todayEntry) {
      alert('Create today\'s entry first by setting your mood')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${todayEntry.id}.${fileExt}`
      const filePath = `dbt-worksheets/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('dbt-worksheets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('dbt-worksheets')
        .getPublicUrl(filePath)

      addOrUpdateEntry({ worksheetUrl: publicUrl })
      console.log('✅ Worksheet uploaded')
    } catch (err) {
      console.error('Error uploading worksheet:', err)
      alert('Failed to upload worksheet. Check console.')
    } finally {
      setUploading(false)
    }
  }

  const deleteEntry = (id: string) => {
    if (!confirm('Delete this entry?')) return
    update(d => ({
      ...d,
      dbtEntries: d.dbtEntries.filter(e => e.id !== id)
    }))
  }

  const getMoodColor = (mood: number) => {
    if (mood <= 3) return '#ff3b30'
    if (mood <= 5) return '#ff9500'
    if (mood <= 7) return '#ffcc00'
    return '#34c759'
  }

  const avgMood = entries.length > 0 
    ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
    : 0

  return (
    <div className="dbt-view">
      <div className="dbt-header">
        <div>
          <h1>DBT Skills Tracker</h1>
          <p className="subtitle">You've got this. One skill at a time. 🫂</p>
        </div>
        <div className="dbt-stats">
          <div className="stat">
            <div className="stat-label">Entries</div>
            <div className="stat-value">{entries.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Avg Mood</div>
            <div className="stat-value" style={{ color: getMoodColor(parseFloat(avgMood as any)) }}>
              {avgMood}/10
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Weeks</div>
            <div className="stat-value">20</div>
          </div>
        </div>
      </div>

      {todayEntry ? (
        <TodayEntry 
          entry={todayEntry} 
          onUpdate={addOrUpdateEntry} 
          getMoodColor={getMoodColor}
          onFileUpload={handleFileUpload}
          uploading={uploading}
        />
      ) : (
        <StartEntry onStart={addOrUpdateEntry} />
      )}

      {entries.length > 0 && (
        <div className="history-section">
          <h2>History</h2>
          <div className="entries-list">
            {entries.map(entry => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                getMoodColor={getMoodColor}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StartEntry({ onStart }: { onStart: (entry: Partial<DBTEntry>) => void }) {
  return (
    <div className="card start-entry">
      <div className="start-content">
        <h2>Today\'s Check-In</h2>
        <p>How are you feeling right now?</p>
        <div className="mood-buttons">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mood => (
            <button 
              key={mood}
              className="mood-btn"
              style={{ backgroundColor: getMoodColor(mood) }}
              onClick={() => onStart({ mood })}
            >
              {mood}
            </button>
          ))}
        </div>
        <p className="mood-hint">Pick a number to get started</p>
      </div>
    </div>
  )
}

function TodayEntry({ entry, onUpdate, getMoodColor, onFileUpload, uploading }: { 
  entry: DBTEntry
  onUpdate: (e: Partial<DBTEntry>) => void
  getMoodColor: (m: number) => string
  onFileUpload: (file: File) => void
  uploading: boolean
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="card today-entry">
      <h2>Today\'s Entry</h2>
      
      <div className="mood-section">
        <label>How are you feeling?</label>
        <div className="mood-slider">
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={entry.mood}
            onChange={(e) => onUpdate({ mood: parseInt(e.target.value) })}
            style={{ 
              background: `linear-gradient(to right, #ff3b30, #34c759)`
            }}
          />
          <span className="mood-display" style={{ color: getMoodColor(entry.mood) }}>
            {entry.mood}/10
          </span>
        </div>
      </div>

      <div className="skills-section">
        <label>Skills practiced today:</label>
        <div className="skills-grid">
          {[
            { key: 'mindfulness', label: '🧘 Mindfulness', desc: 'Present moment awareness' },
            { key: 'distressTolerance', label: '💪 Distress Tolerance', desc: 'Surviving the crisis' },
            { key: 'emotionRegulation', label: '🌊 Emotion Regulation', desc: 'Managing emotions' },
            { key: 'interpersonalEffectiveness', label: '🤝 Interpersonal', desc: 'Relationship skills' }
          ].map(skill => (
            <button 
              key={skill.key}
              className={`skill-btn ${entry.skills[skill.key as keyof typeof entry.skills] ? 'active' : ''}`}
              onClick={() => onUpdate({
                skills: {
                  ...entry.skills,
                  [skill.key]: !entry.skills[skill.key as keyof typeof entry.skills]
                }
              })}
            >
              <div className="skill-check">{entry.skills[skill.key as keyof typeof entry.skills] ? '✓' : '○'}</div>
              <div className="skill-label">{skill.label}</div>
              <div className="skill-desc">{skill.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="notes-section">
        <label>Reflections:</label>
        <textarea 
          value={entry.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="What happened today? How did the skills help? What was hard?"
          className="notes-input"
        />
      </div>

      <div className="worksheet-section">
        <label>📄 DBT Worksheet:</label>
        <div className="worksheet-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading...' : '+ Upload Worksheet'}
          </button>
          {entry.worksheetUrl && (
            <a href={entry.worksheetUrl} target="_blank" rel="noopener noreferrer" className="worksheet-link">
              📎 View Worksheet
            </a>
          )}
        </div>
      </div>

      <div className="encouragement">
        ✨ You\'re showing up for yourself. That takes strength.
      </div>
    </div>
  )
}

function EntryCard({ entry, getMoodColor, onDelete }: { entry: DBTEntry; getMoodColor: (m: number) => string; onDelete: () => void }) {
  const date = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const skillsUsed = Object.values(entry.skills).filter(Boolean).length

  return (
    <div className="entry-card">
      <div className="entry-header">
        <div>
          <div className="entry-date">{date}</div>
          <div className="entry-mood" style={{ color: getMoodColor(entry.mood) }}>
            Mood: {entry.mood}/10
          </div>
        </div>
        <div className="entry-skills">
          <span className="skills-badge">{skillsUsed} skills</span>
          {entry.worksheetUrl && (
            <a href={entry.worksheetUrl} target="_blank" rel="noopener noreferrer" className="worksheet-icon" title="View worksheet">
              📎
            </a>
          )}
          <button className="icon-btn delete" onClick={onDelete}>✕</button>
        </div>
      </div>
      {entry.notes && (
        <div className="entry-notes">{entry.notes}</div>
      )}
    </div>
  )
}

function getMoodColor(mood: number) {
  if (mood <= 3) return '#ff3b30'
  if (mood <= 5) return '#ff9500'
  if (mood <= 7) return '#ffcc00'
  return '#34c759'
}
