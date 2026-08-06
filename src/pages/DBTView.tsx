import { AppData, DBTEntry } from '../types'
import { generateId } from '../utils/id'
import { supabase } from '../lib/supabase'
import { getLocalDateString } from '../utils/weekUtils'
import './DBTView.css'
import React, { useState, useRef } from 'react'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function DBTView({ data, update }: Props) {
  const entries = data.dbtEntries
  const today = getLocalDateString()
  const todayEntry = entries.find(e => e.date === today)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const worksheetFileRef = useRef<HTMLInputElement>(null)
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reflectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const syncToSupabase = async (entry: DBTEntry) => {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        throw new Error('Not authenticated')
      }

      const dbEntry: any = {
        id: entry.id,
        user_id: user.id,
        date: entry.date,
        mood: entry.mood,
        skills: entry.skills,
        notes: entry.notes,
        study_notes: entry.studyNotes,
        worksheet_url: entry.worksheetUrl || null,
        created_at: entry.createdAt
      }
      // Only include worksheet_page if not default
      if (entry.worksheetPage && entry.worksheetPage !== 1) {
        dbEntry.worksheet_page = entry.worksheetPage
      }

      if (todayEntry && todayEntry.id === entry.id) {
        // Update existing
        const { error: err } = await supabase
          .from('dbt_entries')
          .update(dbEntry)
          .eq('id', entry.id)
          .eq('user_id', user.id)
        
        if (err) throw err
        console.log('✅ DBT entry updated:', entry.id)
      } else {
        // Insert new
        const { error: err } = await supabase
          .from('dbt_entries')
          .insert([dbEntry])
        
        if (err) throw err
        console.log('✅ DBT entry inserted:', entry.id)
      }
      
      setError('')
    } catch (err) {
      console.error('Supabase sync error:', err)
      throw err
    }
  }

  const addOrUpdateEntry = async (entry: Partial<DBTEntry>) => {
    setSyncing(true)
    setError('')
    
    try {
      if (todayEntry) {
        // Update existing
        const updated = { ...todayEntry, ...entry }
        update(d => ({
          ...d,
          dbtEntries: d.dbtEntries.map(e => 
            e.id === todayEntry.id ? updated : e
          )
        }))
        await syncToSupabase(updated)
      } else {
        // Create new
        const newEntry: DBTEntry = {
          id: generateId(),
          date: today,
          mood: entry.mood || 5,
          skills: entry.skills || {
            mindfulness: false,
            distressTolerance: false,
            emotionRegulation: false,
            interpersonalEffectiveness: false
          },
          notes: entry.notes || '',
          studyNotes: entry.studyNotes || '',
          worksheetUrl: entry.worksheetUrl,
          worksheetPage: entry.worksheetPage || 1,
          createdAt: new Date().toISOString()
        }
        
        update(d => ({
          ...d,
          dbtEntries: [newEntry, ...d.dbtEntries]
        }))
        
        await syncToSupabase(newEntry)
      }
    } catch (err: any) {
      console.error('DBT save error:', err)
      const msg = err?.message || err?.details || JSON.stringify(err)
      setError(`Save failed: ${msg}`)
    } finally {
      setSyncing(false)
    }
  }

  const debouncedReflectionsSave = (text: string) => {
    if (reflectionsTimeoutRef.current) clearTimeout(reflectionsTimeoutRef.current)
    reflectionsTimeoutRef.current = setTimeout(() => {
      addOrUpdateEntry({ notes: text })
    }, 1500)
  }

  const debouncedNotesSave = (text: string) => {
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current)
    notesTimeoutRef.current = setTimeout(() => {
      addOrUpdateEntry({ studyNotes: text })
    }, 1500)
  }

  const handleWorksheetUpload = async (file: File) => {
    if (!todayEntry) {
      alert('Create today\'s entry first by setting your mood')
      return
    }

    setUploading(true)
    setError('')
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `worksheet-${todayEntry.id}.${fileExt}`
      const filePath = `dbt-worksheets/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('dbt-worksheets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('dbt-worksheets')
        .getPublicUrl(filePath)

      await addOrUpdateEntry({ 
        worksheetUrl: publicUrl,
        worksheetPage: 1
      })
      console.log('✅ Worksheet uploaded and saved')
    } catch (err) {
      console.error('Error uploading worksheet:', err)
      setError('Failed to upload worksheet')
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
          <p className="subtitle">You\'ve got this. One skill at a time. 🫂</p>
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
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="icon-btn" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {todayEntry ? (
        <TodayEntry 
          entry={todayEntry} 
          onUpdate={addOrUpdateEntry} 
          onReflectionsChange={debouncedReflectionsSave}
          onNotesChange={debouncedNotesSave}
          getMoodColor={getMoodColor}
          onWorksheetUpload={handleWorksheetUpload}
          uploading={uploading}
          syncing={syncing}
          worksheetFileRef={worksheetFileRef}
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

function TodayEntry({ entry, onUpdate, onReflectionsChange, onNotesChange, getMoodColor, onWorksheetUpload, uploading, syncing, worksheetFileRef }: {
  entry: DBTEntry
  onUpdate: (e: Partial<DBTEntry>) => void
  onReflectionsChange: (text: string) => void
  onNotesChange: (text: string) => void
  getMoodColor: (m: number) => string
  onWorksheetUpload: (file: File) => void
  uploading: boolean
  syncing: boolean
  worksheetFileRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="dbt-container">
      {/* Worksheet Area */}
      <div className="worksheet-section">
        {!entry.worksheetUrl ? (
          <div className="worksheet-empty">
            <h3>📄 Today\'s Worksheet</h3>
            <p>Upload your DBT worksheet</p>
            <button 
              className="button"
              onClick={() => worksheetFileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '+ Upload PDF'}
            </button>
            <input
              ref={worksheetFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && onWorksheetUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="worksheet-viewer">
            <div className="worksheet-header">
              <h3>Worksheet</h3>
              <button 
                className="button small secondary"
                onClick={() => worksheetFileRef.current?.click()}
              >
                📁 Replace
              </button>
              <input
                ref={worksheetFileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && onWorksheetUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
            <div className="worksheet-embed">
              {entry.worksheetUrl.endsWith('.pdf') ? (
                <iframe 
                  src={`${entry.worksheetUrl}#page=${entry.worksheetPage || 1}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="DBT Worksheet"
                />
              ) : (
                <img 
                  src={entry.worksheetUrl} 
                  alt="Worksheet" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes & Skills Area */}
      <div className="dbt-notes-section">
        <div className="saving-indicator" style={{ opacity: syncing ? 1 : 0 }}>
          ⏳ Saving...
        </div>

        <div className="mood-section">
          <label>Mood</label>
          <div className="mood-slider">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={entry.mood}
              onChange={(e) => onUpdate({ mood: parseInt(e.target.value) })}
              style={{ background: `linear-gradient(to right, #ff3b30, #34c759)` }}
              disabled={syncing}
            />
            <span className="mood-display" style={{ color: getMoodColor(entry.mood) }}>
              {entry.mood}/10
            </span>
          </div>
        </div>

        <div className="skills-section">
          <label>Skills practiced:</label>
          <div className="skills-grid">
            {[
              { key: 'mindfulness', label: '🧘 Mindfulness', desc: 'Present moment' },
              { key: 'distressTolerance', label: '💪 Distress Tolerance', desc: 'Survive crisis' },
              { key: 'emotionRegulation', label: '🌊 Emotion Reg', desc: 'Manage emotions' },
              { key: 'interpersonalEffectiveness', label: '🤝 Interpersonal', desc: 'Relationships' }
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
                disabled={syncing}
              >
                <div className="skill-check">{entry.skills[skill.key as keyof typeof entry.skills] ? '✓' : '○'}</div>
                <div className="skill-label">{skill.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="notes-tabs">
          <div className="reflections-section">
            <label>Reflections</label>
            <textarea 
              defaultValue={entry.notes}
              onChange={(e) => onReflectionsChange(e.target.value)}
              placeholder="What happened today? How did skills help?"
              className="notes-input reflections"
            />
          </div>

          <div className="study-notes-section">
            <label>📚 Study Notes</label>
            <textarea 
              defaultValue={entry.studyNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Personal notes, insights, things to remember..."
              className="notes-input study-notes"
            />
          </div>
        </div>

        <div className="encouragement">
          ✨ You\'re showing up. That takes strength.
        </div>
      </div>
    </div>
  )
}

function EntryCard({ entry, getMoodColor, onDelete }: { 
  entry: DBTEntry
  getMoodColor: (m: number) => string
  onDelete: () => void
}) {
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
        <div className="entry-actions">
          <span className="skills-badge">{skillsUsed} skills</span>
          {entry.worksheetUrl && <span className="worksheet-icon">📄</span>}
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
