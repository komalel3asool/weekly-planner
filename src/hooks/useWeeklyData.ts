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
      console.log('🔍 Fetching week:', weekKey)
      
      try {
        // Try to fetch current week
        const { data: records, error: fetchError } = await supabase
          .from('weekly_plans')
          .select('data')
          .eq('user_id', userId)
          .eq('week_key', weekKey)

        console.log('📊 Current week records:', records?.length, records)

        if (records && records.length > 0) {
          console.log('✅ Found current week, loading data')
          setData(records[0].data)
          setLoading(false)
          return
        }

        // No current week - try to carry over from previous week
        const prevWeekKey = getPreviousWeekKey(weekKey)
        console.log('🔙 Trying previous week:', prevWeekKey)
        
        const { data: prevRecords } = await supabase
          .from('weekly_plans')
          .select('data')
          .eq('user_id', userId)
          .eq('week_key', prevWeekKey)

        console.log('📋 Previous week records:', prevRecords?.length, prevRecords)

        if (prevRecords && prevRecords.length > 0) {
          const prevData = prevRecords[0].data
          console.log('📈 Previous week habits:', prevData?.weekly?.length)
          
          if (prevData?.weekly && prevData.weekly.length > 0) {
            console.log('🎯 Carrying over habits!')
            // Carry over weekly habits with count reset
            const carriedWeekly = prevData.weekly.map((h: any) => ({
              ...h,
              count: 0
            }))
            // Carry over daily habits
            const carriedDaily = prevData.daily || []
            const carryoverData = { ...seed(), weekly: carriedWeekly, daily: carriedDaily, focus: prevData.focus }
            
            console.log('💾 Saving carryover data')
            setData(carryoverData)
            
            // Save carryover data for this week
            const { error: insertError } = await supabase.from('weekly_plans').insert({
              user_id: userId,
              week_key: weekKey,
              data: carryoverData
            })
            
            if (insertError) {
              console.error('❌ Insert error:', insertError)
            } else {
              console.log('✅ Carryover saved!')
            }
          } else {
            console.log('⚠️ No habits in previous week')
            setData(seed())
          }
        } else {
          console.log('⚠️ No previous week data found')
          setData(seed())
        }
      } catch (err) {
        console.error('💥 Error fetching week data:', err)
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
          console.log('🔔 Real-time update:', payload.new?.week_key)
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