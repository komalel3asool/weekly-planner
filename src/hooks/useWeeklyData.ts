import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WeekData } from '@/types'

const seed = (): WeekData => ({
  lists: {
    done: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
    todos: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
    meetings: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
    results: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] }
  },
  daily: [],
  weekly: [],
  shopping: [],
  focus: ''
})

function getPreviousWeekKey(weekKey: string): string {
  const [year, week] = weekKey.split('-W').map(Number)
  if (week <= 1) {
    return `${year - 1}-W52`
  }
  return `${year}-W${String(week - 1).padStart(2, '0')}`
}

export function useWeeklyData(weekKey: string) {
  const [data, setData] = useState<WeekData>(seed())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetch = async () => {
      setLoading(true)      
      try {
        // 1. Try to fetch current week
        const { data: records } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_key', weekKey)

        if (records && records.length > 0) {          setData(records[0].data)
          setLoading(false)
          return
        }        
        // 2. Current week doesn't exist, fetch previous week
        const prevWeekKey = getPreviousWeekKey(weekKey)        
        const { data: prevRecords } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_key', prevWeekKey)
        if (prevRecords && prevRecords.length > 0) {
          const prevData = prevRecords[0].data          
          if (prevData?.weekly && prevData.weekly.length > 0) {            // Carry over habits
            const carriedWeekly = prevData.weekly.map((h: any) => ({
              ...h,
              count: 0
            }))
            const carriedDaily = prevData.daily || []
            const carryoverData = { ...seed(), weekly: carriedWeekly, daily: carriedDaily, focus: prevData.focus || '' }
            
            setData(carryoverData)            
            // Save this carryover data
            const { error } = await supabase.from('weekly_plans').insert({
              user_id: userId,
              week_key: weekKey,
              data: carryoverData
            })
            
            if (error) {
              console.error('❌ Error saving carryover:', error)
            } else {            }
          } else {            setData(seed())
          }
        } else {          setData(seed())
        }
      } catch (err) {
        console.error('💥 Error:', err)
        setData(seed())
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [weekKey, userId])

  const update = useCallback(
    async (fn: (d: WeekData) => WeekData) => {
      if (!userId) return
      const newData = fn(data)
      setData(newData)
      try {
        await supabase.from('weekly_plans').upsert(
          { user_id: userId, week_key: weekKey, data: newData },
          { onConflict: 'user_id,week_key' }
        )
      } catch (err) {
        console.error('Error updating:', err)
      }
    },
    [data, userId, weekKey]
  )

  return { data, loading, update }
}