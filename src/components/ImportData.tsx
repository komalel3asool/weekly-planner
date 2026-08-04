import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WeekData } from '@/types'

export function ImportData({ onSuccess }: { onSuccess: () => void }) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImport = async () => {
    setLoading(true)
    setError('')

    try {
      const data = JSON.parse(jsonText)
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      let count = 0
      for (const [weekKey, weekData] of Object.entries(data)) {
        const old = weekData as any
        const weekly = old.weekly?.map((h: any) => ({
          name: h.name,
          target: 5,
          count: h.done ? Object.values(h.done).filter(v => v).length : 0
        })) || []

        const converted: WeekData = {
          lists: old.lists || { done: {}, todos: {}, meetings: {}, results: {} },
          daily: old.daily || [],
          weekly,
          shopping: old.shopping || [],
          focus: old.focus || ''
        }

        await supabase.from('weekly_plans').upsert({
          user_id: user.user.id,
          week_key: weekKey,
          data: converted
        }, { onConflict: 'user_id,week_key' })
        count++
      }

      alert(`✅ Imported ${count} weeks!`)
      setJsonText('')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: '2rem', right: '2rem', width: '400px', padding: '2rem', border: '2px solid #fcd34d', borderRadius: '8px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 1000 }}>
      <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>📥 Import Old Data</h3>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="Paste your weekly JSON..."
        style={{ width: '100%', height: '180px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '1rem' }}
      />
      {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>❌ {error}</div>}
      <button
        onClick={handleImport}
        disabled={!jsonText || loading}
        style={{ width: '100%', padding: '0.75rem', background: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: !jsonText || loading ? 0.5 : 1, marginBottom: '0.5rem' }}
      >
        {loading ? '⏳ Importing...' : '✅ Import All Weeks'}
      </button>
      <button
        onClick={onSuccess}
        style={{ width: '100%', padding: '0.75rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
      >
        Skip for now
      </button>
    </div>
  )
}
