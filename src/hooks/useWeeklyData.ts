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
        const { data: records } = await supabase
          .from('weekly_plans')
          .select('data')
          .eq('user_id', userId)
          .eq('week_key', weekKey)

        if (records && records.length > 0) {
          setData(records[0].data)
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