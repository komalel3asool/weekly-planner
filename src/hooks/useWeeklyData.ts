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
  if (week <= 1) return `${year - 1}-W52`
  return `${year}-W${String(week - 1).padStart(2, '0')}`
}

export function useWeeklyData(weekKey: string) {
  const [data, setData] = useState<WeekData>(seed())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const fetch = async () => {
      try {
        // Fetch this week's data
        const { data: records } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_key', weekKey)

        if (records?.length > 0) {
          setData(records[0].data)
          return
        }

        // Week doesn't exist - copy from previous week
        const prevWeekKey = getPreviousWeekKey(weekKey)
        const { data: prevRecords } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_key', prevWeekKey)

        if (prevRecords?.length > 0 && prevRecords[0].data?.weekly?.length > 0) {
          console.log('📋 Carrying over', prevRecords[0].data.weekly.length, 'habits from', prevWeekKey)
          // Copy previous week's habits with count reset
          const carryover = {
            ...seed(),
            weekly: prevRecords[0].data.weekly.map((h: any) => ({ ...h, count: 0 })),
            daily: prevRecords[0].data.daily || [],
            focus: prevRecords[0].data.focus || ''
          }
          setData(carryover)
          
          // Save this carryover
          await supabase.from('weekly_plans').upsert(
            { user_id: userId, week_key: weekKey, data: carryover },
            { onConflict: 'user_id,week_key' }
          )
        } else {
          setData(seed())
        }
      } catch (err) {
        console.error('Error:', err)
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
      await supabase.from('weekly_plans').upsert(
        { user_id: userId, week_key: weekKey, data: newData },
        { onConflict: 'user_id,week_key' }
      )
    },
    [data, userId, weekKey]
  )

  return { data, loading, update }
}