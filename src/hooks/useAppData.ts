import { useState, useEffect, useCallback } from 'react'
import { AppData } from '../types'
import { initializeAppData } from '../utils/weekUtils'
import { supabase } from '../lib/supabase'

export function useAppData() {
  const [data, setData] = useState<AppData>(initializeAppData())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID and fetch data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('❌ No user found')
        setLoading(false)
        return
      }

      console.log('✅ User authenticated:', user.id)
      setUserId(user.id)

      try {
        // Fetch all data in parallel
        const [habitsRes, weekRes, tradesRes, pdfRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', user.id).catch(() => ({ data: [] })),
          supabase.from('week_data').select('*').eq('user_id', user.id).catch(() => ({ data: [] })),
          supabase.from('trades').select('*').eq('user_id', user.id).catch(() => ({ data: [] })),
          supabase.from('pdf_reader').select('*').eq('user_id', user.id).catch(() => ({ data: null }))
        ])

        const appData: AppData = {
          habits: (habitsRes as any).data || [],
          weeks: {},
          trades: (tradesRes as any).data || [],
          pdfReader: (pdfRes as any).data || { url: '', currentPage: 1, notes: '' },
          focus: ''
        }

        // Convert week_data to weeks object
        if ((weekRes as any).data) {
          ((weekRes as any).data).forEach((w: any) => {
            appData.weeks[w.week_key] = {
              weekKey: w.week_key,
              year: w.year,
              week: w.week,
              focus: w.focus,
              days: w.days
            }
          })
        }

        setData(appData)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  // Setup realtime listeners
  useEffect(() => {
    if (!userId) return

    const channels: any[] = []

    // Habits channel
    const habitsChannel = supabase
      .channel(`habits-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` }, () => {
        supabase.from('habits').select('*').eq('user_id', userId).then(({ data }) => {
          setData(d => ({ ...d, habits: data || [] }))
        })
      })
      .subscribe()
    channels.push(habitsChannel)

    // Week data channel
    const weekChannel = supabase
      .channel(`week_data-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_data', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setData(d => {
            const weeks = { ...d.weeks }
            delete weeks[(payload.old as any).week_key]
            return { ...d, weeks }
          })
        } else {
          const week = payload.new as any
          setData(d => ({
            ...d,
            weeks: {
              ...d.weeks,
              [week.week_key]: {
                weekKey: week.week_key,
                year: week.year,
                week: week.week,
                focus: week.focus,
                days: week.days
              }
            }
          }))
        }
      })
      .subscribe()
    channels.push(weekChannel)

    // Trades channel
    const tradesChannel = supabase
      .channel(`trades-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, () => {
        supabase.from('trades').select('*').eq('user_id', userId).then(({ data }) => {
          setData(d => ({ ...d, trades: data || [] }))
        })
      })
      .subscribe()
    channels.push(tradesChannel)

    // PDF channel
    const pdfChannel = supabase
      .channel(`pdf_reader-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdf_reader', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.new) {
          setData(d => ({
            ...d,
            pdfReader: {
              url: (payload.new as any).url || '',
              currentPage: (payload.new as any).current_page || 1,
              notes: (payload.new as any).notes || ''
            }
          }))
        }
      })
      .subscribe()
    channels.push(pdfChannel)

    return () => {
      channels.forEach(ch => ch.unsubscribe())
    }
  }, [userId])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    const newData = fn(data)
    setData(newData)

    // Sync to Supabase
    if (!userId) return

    const syncToSupabase = async () => {
      try {
        // Sync habits
        if (newData.habits.length > 0) {
          await supabase.from('habits').upsert(
            newData.habits.map(h => ({
              id: h.id,
              user_id: userId,
              name: h.name,
              type: h.type,
              color: h.color,
              icon: h.icon,
              status: h.status,
              created_at: h.createdAt,
              paused_at: h.pausedAt || null,
              current_streak: h.currentStreak || 0,
              longest_streak: h.longestStreak || 0,
              notes: h.notes || null
            }))
          )
        }

        // Sync week data
        await Promise.all(
          Object.values(newData.weeks).map(w =>
            supabase.from('week_data').upsert({
              user_id: userId,
              week_key: w.weekKey,
              year: w.year,
              week: w.week,
              focus: w.focus || '',
              days: w.days
            }, { onConflict: 'user_id,week_key' })
          )
        )

        // Sync trades
        if (newData.trades.length > 0) {
          await supabase.from('trades').upsert(
            newData.trades.map(t => ({
              id: t.id,
              user_id: userId,
              date: t.date,
              ticker: t.ticker,
              strategy: t.strategy,
              direction: t.direction,
              outcome: t.outcome,
              r: t.r,
              note: t.note || null
            }))
          )
        }

        // Sync PDF reader
        await supabase.from('pdf_reader').upsert({
          user_id: userId,
          url: newData.pdfReader.url || '',
          current_page: newData.pdfReader.currentPage || 1,
          notes: newData.pdfReader.notes || ''
        }, { onConflict: 'user_id' })
      } catch (err) {
        console.error('Error syncing:', err)
      }
    }

    syncToSupabase()
  }, [data, userId])

  return { data, loading, update, userId }
}
