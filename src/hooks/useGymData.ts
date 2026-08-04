import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGymData(week: number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: record } = await supabase
        .from('gym_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('week', week)
        .single()

      setData(record?.data || {})
    } catch (err) {
      setData({})
    } finally {
      setLoading(false)
    }
  }, [week])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const update = useCallback(async (fn: (d: any) => any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newData = fn(data || {})
    setData(newData)

    await supabase
      .from('gym_workouts')
      .upsert({ user_id: user.id, week, data: newData }, { onConflict: 'user_id,week' })
  }, [data, week])

  return { data, update, loading }
}