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
      try {
        const { data: record, error } = await supabase
          .from('weekly_plans')
          .select('data')
          .eq('user_id', userId)
          .eq('week_key', weekKey)
          .single()

        if (record?.data) {
          setData(record.data)
        } else if (error?.code === 'PGRST116') {
          // No data found for this week - carry over from previous week
          const prevWeekKey = getPreviousWeekKey(weekKey)
          const { data: prevRecord } = await supabase
            .from('weekly_plans')
            .select('data')
            .eq('user_id', userId)
            .eq('week_key', prevWeekKey)
            .single()

          if (prevRecord?.data?.weekly && prevRecord.data.weekly.length > 0) {
            // Carry over weekly habits with count reset
            const carriedWeekly = prevRecord.data.weekly.map((h: any) => ({
              ...h,
              count: 0
            }))
            // Carry over daily habits structure
            const carriedDaily = prevRecord.data.daily || []
            const carryoverData = { ...seed(), weekly: carriedWeekly, daily: carriedDaily }
            setData(carryoverData)
            
            // Persist the carryover data
            await supabase.from('weekly_plans').insert({
              user_id: userId,
              week_key: weekKey,
              data: carryoverData
            })
          } else {
            setData(seed())
          }
        } else {
          setData(seed())
        }
      } catch (err) {
        console.error('Error fetching week data:', err)
        setData(seed())
      } finally {
        setLoading(false)
      }
    }

    fetch()

    const sub = supabase
      .channel(`weekly-${weekKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_plans',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && payload.new.week_key === weekKey) {
            setData(payload.new.data)
          }
        }
      )
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
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