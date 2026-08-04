import { useState } from 'react'
import { Share2 } from 'lucide-react'

const PROGRAM = {
  'Week 1-4': { phase: 'Foundation', sets: 3, reps: '10-12', rest: '90s' },
  'Week 5-8': { phase: 'Intensification', sets: 4, reps: '8-10', rest: '75s' },
  'Week 9-12': { phase: 'Shred/Peak', sets: 4, reps: '6-8 + drop', rest: '60s' }
}

const WORKOUTS: { [key: string]: { name: string; exercises: any[] } } = {
  'Day 1': {
    name: 'Push',
    exercises: [
      { name: 'Barbell Bench Press', defaultSets: 3 },
      { name: 'Incline Dumbbell Press', defaultSets: 3 },
      { name: 'Machine Chest Fly', defaultSets: 3 },
      { name: 'Lateral Raise', defaultSets: 3 },
      { name: 'Overhead Press', defaultSets: 3 },
      { name: 'Tricep Dips', defaultSets: 3 }
    ]
  },
  'Day 2': {
    name: 'Pull',
    exercises: [
      { name: 'Barbell Bent-Over Row', defaultSets: 3 },
      { name: 'Pull-ups / Lat Pulldown', defaultSets: 3 },
      { name: 'Barbell Curl', defaultSets: 3 },
      { name: 'Cable Row', defaultSets: 3 },
      { name: 'Face Pulls', defaultSets: 3 },
      { name: 'Hammer Curl', defaultSets: 3 }
    ]
  },
  'Day 3': {
    name: 'Legs',
    exercises: [
      { name: 'Barbell Back Squat', defaultSets: 4 },
      { name: 'Romanian Deadlift', defaultSets: 3 },
      { name: 'Leg Press', defaultSets: 3 },
      { name: 'Leg Curl', defaultSets: 3 },
      { name: 'Leg Extension', defaultSets: 3 },
      { name: 'Calf Raise', defaultSets: 3 }
    ]
  }
}

export function GymTracker({ onBack }: { onBack: () => void }) {
  const [week, setWeek] = useState(1)
  const [day, setDay] = useState('Day 1')
  const [sets, setSets] = useState<any>({})

  const getPhase = () => {
    if (week <= 4) return Object.values(PROGRAM)[0]
    if (week <= 8) return Object.values(PROGRAM)[1]
    return Object.values(PROGRAM)[2]
  }

  const phase = getPhase()
  const workout = WORKOUTS[day]
  const setKey = `w${week}d${day.replace(' ', '')}`

  const handleSetChange = (exIdx: number, setIdx: number, field: string, value: string) => {
    if (!sets[setKey]) sets[setKey] = {}
    if (!sets[setKey][exIdx]) sets[setKey][exIdx] = []
    if (!sets[setKey][exIdx][setIdx]) sets[setKey][exIdx][setIdx] = { weight: '', reps: '' }
    sets[setKey][exIdx][setIdx][field] = value
    setSets({ ...sets })
  }

  const calcVolume = () => {
    if (!sets[setKey]) return 0
    return Object.values(sets[setKey]).reduce((total: number, ex: any) => {
      return total + (Array.isArray(ex) ? ex.reduce((s: number, set: any) => s + (parseInt(set.weight || 0) * parseInt(set.reps || 0)), 0) : 0)
    }, 0)
  }

  const exportWorkout = () => {
    const text = `💪 ${day} · ${phase.phase}\n${week}/12 weeks\n\n${new Date().toLocaleDateString()}\n\nVolume: ${calcVolume().toLocaleString()} kg`
    navigator.clipboard.writeText(text)
    alert('✅ Copied to clipboard! Ready to post 🔥')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>←</button>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>💪 Gym</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>12-week shred · {phase.phase} phase</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #374151', borderRadius: '8px', background: '#1f2937' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Week</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <button key={i + 1} onClick={() => setWeek(i + 1)} style={{ padding: '0.5rem', background: week === i + 1 ? '#f97316' : '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: week === i + 1 ? 'bold' : 'normal' }}>{i + 1}</button>
            ))}
          </div>
        </div>

        <div style={{ background: '#111827', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#d1d5db' }}>{phase.sets} x {phase.reps} · {phase.rest} rest</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Workout</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.keys(WORKOUTS).map(d => (
            <button key={d} onClick={() => setDay(d)} style={{ padding: '0.75rem 1.5rem', background: day === d ? '#1f1f1f' : '#374151', color: day === d ? '#f97316' : '#9ca3af', border: day === d ? '2px solid #f97316' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: day === d ? 'bold' : 'normal' }}>{d} · {WORKOUTS[d].name}</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #374151' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{day} · {workout.name}</h2>
          <button onClick={exportWorkout} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>📤 Export</button>
        </div>

        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#111827', borderRadius: '6px', color: '#9ca3af', fontSize: '0.875rem' }}>Volume: <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1.25rem' }}>{calcVolume().toLocaleString()}</span> kg</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {workout.exercises.map((ex, exIdx) => (
            <div key={exIdx} style={{ borderTop: '1px solid #374151', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>{ex.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: phase.sets }).map((_, setIdx) => (
                  <div key={setIdx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af', minWidth: '50px' }}>Set {setIdx + 1}</span>
                    <input type="number" placeholder="kg" value={sets[setKey]?.[exIdx]?.[setIdx]?.weight || ''} onChange={(e) => handleSetChange(exIdx, setIdx, 'weight', e.target.value)} style={{ padding: '0.5rem', background: '#111827', border: '1px solid #374151', borderRadius: '4px', color: 'white' }} />
                    <input type="number" placeholder="reps" value={sets[setKey]?.[exIdx]?.[setIdx]?.reps || ''} onChange={(e) => handleSetChange(exIdx, setIdx, 'reps', e.target.value)} style={{ padding: '0.5rem', background: '#111827', border: '1px solid #374151', borderRadius: '4px', color: 'white' }} />
                    <span style={{ fontSize: '0.875rem', color: '#f97316', fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>{sets[setKey]?.[exIdx]?.[setIdx]?.weight && sets[setKey]?.[exIdx]?.[setIdx]?.reps ? `${parseInt(sets[setKey][exIdx][setIdx].weight) * parseInt(sets[setKey][exIdx][setIdx].reps)} kg` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
