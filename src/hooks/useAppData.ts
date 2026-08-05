import { useState, useEffect, useCallback, useRef } from 'react'
import { AppData } from '../types'
import { initializeAppData } from '../utils/weekUtils'
import { supabase } from '../lib/supabase'

export function useAppData() {
  const [data, setData] = useState<AppData>(initializeAppData())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const lastLocalUpdateRef = useRef(0)

  // Get user ID and fetch data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.log('❌ No user found')
          setLoading(false)
          return
        }

        console.log('✅ User authenticated:', user.id)
        setUserId(user.id)

        // Fetch all data individually with proper error handling
        const appData: AppData = {
          habits: [],
          weeks: {},
          trades: [],
          pdfReader: { url: '', currentPage: 1, notes: '' },
          focus: ''
        }

        try {
          const { data: habitsData, error: habitsErr } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
          if (habitsErr) throw habitsErr
          appData.habits = habitsData || []
          console.log('✅ Loaded', appData.habits.length, 'habits')
        } catch (err) {
          console.error('Error loading habits:', err)
        }

        try {
          const { data: weekData, error: weekErr } = await supabase
            .from('week_data')
            .select('*')
            .eq('user_id', user.id)
          if (weekErr) throw weekErr
          
          if (weekData) {
            weekData.forEach(w => {
              appData.weeks[w.week_key] = {
                weekKey: w.week_key,
                year: w.year,
                week: w.week,
                focus: w.focus,
                days: w.days
              }
            })
          }
          console.log('✅ Loaded', Object.keys(appData.weeks).length, 'weeks')
        } catch (err) {
          console.error('Error loading weeks:', err)
        }

        try {
          const { data: tradesData, error: tradesErr } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
          if (tradesErr) throw tradesErr
          appData.trades = tradesData || []
          console.log('✅ Loaded', appData.trades.length, 'trades')
        } catch (err) {
          console.error('Error loading trades:', err)
        }

        try {
          const { data: pdfData, error: pdfErr } = await supabase
            .from('pdf_reader')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          if (pdfErr && pdfErr.code !== 'PGRST116') throw pdfErr
          if (pdfData) {
            appData.pdfReader = {
              url: pdfData.url || '',
              currentPage: pdfData.current_page || 1,
              notes: pdfData.notes || ''
            }
          }
          console.log('✅ Loaded PDF data')
        } catch (err) {
          console.error('Error loading PDF:', err)
        }

        setData(appData)
      } catch (err) {
        console.error('Error fetching user:', err)
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
    const DEBOUNCE_MS = 100

    try {
      const habitsChannel = supabase
        .channel(`habits-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` }, (payload) => {
          supabase.from('habits').select('*').eq('user_id', userId).then(({ data }) => {
            if (!data) return
            console.log('✅ Habit definitions updated from Supabase')
            setData(d => ({ ...d, habits: data }))
          })
        })
        .subscribe()
      channels.push(habitsChannel)

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

      const tradesChannel = supabase
        .channel(`trades-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, () => {
          // Don't update if we just updated locally (race condition protection)
          if (Date.now() - lastLocalUpdateRef.current < DEBOUNCE_MS) return
          
          supabase.from('trades').select('*').eq('user_id', userId).then(({ data }) => {
            setData(d => ({ ...d, trades: data || [] }))
          })
        })
        .subscribe()
      channels.push(tradesChannel)

      const pdfChannel = supabase
        .channel(`pdf_reader-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pdf_reader', filter: `user_id=eq.${userId}` }, (payload) => {
          // Don't update if we just updated locally (race condition protection)
          if (Date.now() - lastLocalUpdateRef.current < DEBOUNCE_MS) return
          
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
    } catch (err) {
      console.error('Error setting up realtime:', err)
    }

    return () => {
      channels.forEach(ch => ch.unsubscribe())
    }
  }, [userId])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    const newData = fn(data)
    setData(newData)

    if (!userId) return

    const syncToSupabase = async () => {
      try {
        if (newData.habits.length > 0) {
          // Record habit update time to prevent realtime from overwriting
          lastLocalUpdateRef.current = Date.now()
          await supabase.from('habits').upsert(
            newData.habits.map(h => ({
              id: h.id,
              user_id: userId,
              name: h.name,
              type: h.type,
              color: h.color,
              icon: h.icon,
              status: h.status,
              target: h.target || null,
              created_at: h.createdAt,
              paused_at: h.pausedAt || null,
              current_streak: h.currentStreak || 0,
              longest_streak: h.longestStreak || 0,
              notes: h.notes || null
            }))
          )
        }

        // Delete habits that no longer exist locally
        const localIds = new Set(newData.habits.map(h => h.id))
        const deletedIds = data.habits
          .filter(h => !localIds.has(h.id))
          .map(h => h.id)
        
        if (deletedIds.length > 0) {
          console.log('🗑️ Deleting habits:', deletedIds)
          await supabase
            .from('habits')
            .delete()
            .in('id', deletedIds)
        }

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
