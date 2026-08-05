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
          strategies: [],
          tickers: [],
          weeks: {},
          trades: [],
          pdfReader: { url: '', currentPage: 1, notes: '' },
          shoppingList: [],
          dbtEntries: [],
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
          const { data: strategiesData, error: strategiesErr } = await supabase
            .from('strategies')
            .select('*')
            .eq('user_id', user.id)
            .order('name')
          if (strategiesErr) throw strategiesErr
          appData.strategies = strategiesData || []
          console.log('✅ Loaded', appData.strategies.length, 'strategies')
        } catch (err) {
          console.error('Error loading strategies:', err)
        }

        try {
          const { data: tickersData, error: tickersErr } = await supabase
            .from('tickers')
            .select('*')
            .eq('user_id', user.id)
            .order('symbol')
          if (tickersErr) throw tickersErr
          appData.tickers = tickersData || []
          console.log('✅ Loaded', appData.tickers.length, 'tickers')
        } catch (err) {
          console.error('Error loading tickers:', err)
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
          console.log('✅ Loaded', appData.trades.length, 'trades:', appData.trades)
        } catch (err) {
          console.error('❌ Error loading trades:', err)
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

        try {
          const { data: shoppingData, error: shoppingErr } = await supabase
            .from('shopping_list')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (shoppingErr) throw shoppingErr
          appData.shoppingList = shoppingData || []
          console.log('✅ Loaded', appData.shoppingList.length, 'shopping items')
        } catch (err) {
          console.error('Error loading shopping list:', err)
        }

        try {
          const { data: dbtData, error: dbtErr } = await supabase
            .from('dbt_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
          if (dbtErr) throw dbtErr
          appData.dbtEntries = dbtData?.map(entry => ({
            id: entry.id,
            date: entry.date,
            mood: entry.mood,
            skills: entry.skills,
            notes: entry.notes || '',
            worksheetUrl: entry.worksheet_url,
            createdAt: entry.created_at
          })) || []
          console.log('✅ Loaded', appData.dbtEntries.length, 'DBT entries')
        } catch (err) {
          console.error('Error loading DBT entries:', err)
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

      const strategiesChannel = supabase
        .channel(`strategies-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'strategies', filter: `user_id=eq.${userId}` }, () => {
          console.log('🔄 Strategies changed in Supabase, fetching...')
          supabase.from('strategies').select('*').eq('user_id', userId).order('name').then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching strategies:', error)
              return
            }
            console.log('✅ Fetched', data?.length || 0, 'strategies from realtime')
            setData(d => ({ ...d, strategies: data || [] }))
          })
        })
        .subscribe()
      channels.push(strategiesChannel)

      const tickersChannel = supabase
        .channel(`tickers-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickers', filter: `user_id=eq.${userId}` }, () => {
          console.log('🔄 Tickers changed in Supabase, fetching...')
          supabase.from('tickers').select('*').eq('user_id', userId).order('symbol').then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching tickers:', error)
              return
            }
            console.log('✅ Fetched', data?.length || 0, 'tickers from realtime')
            setData(d => ({ ...d, tickers: data || [] }))
          })
        })
        .subscribe()
      channels.push(tickersChannel)

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, (payload) => {
          // Don't update if we just updated locally (race condition protection)
          if (Date.now() - lastLocalUpdateRef.current < DEBOUNCE_MS) {
            console.log('⏭️ Skipping trades realtime (too soon after local update)')
            return
          }
          
          console.log('🔄 Trades changed in Supabase, fetching...')
          supabase.from('trades').select('*').eq('user_id', userId).then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching trades:', error)
              return
            }
            console.log('✅ Fetched', data?.length || 0, 'trades from realtime')
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

      const shoppingChannel = supabase
        .channel(`shopping_list-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list', filter: `user_id=eq.${userId}` }, () => {
          console.log('🔄 Shopping list changed in Supabase, fetching...')
          supabase.from('shopping_list').select('*').eq('user_id', userId).order('created_at', { ascending: false }).then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching shopping list:', error)
              return
            }
            console.log('✅ Fetched', data?.length || 0, 'shopping items from realtime')
            setData(d => ({ ...d, shoppingList: data || [] }))
          })
        })
        .subscribe()
      channels.push(shoppingChannel)

      const dbtChannel = supabase
        .channel(`dbt_entries-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dbt_entries', filter: `user_id=eq.${userId}` }, () => {
          console.log('🔄 DBT entries changed in Supabase, fetching...')
          supabase.from('dbt_entries').select('*').eq('user_id', userId).order('date', { ascending: false }).then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching DBT entries:', error)
              return
            }
            console.log('✅ Fetched', data?.length || 0, 'DBT entries from realtime')
            setData(d => ({ 
              ...d, 
              dbtEntries: (data || []).map(entry => ({
                id: entry.id,
                date: entry.date,
                mood: entry.mood,
                skills: entry.skills,
                notes: entry.notes || '',
                worksheetUrl: entry.worksheet_url,
                createdAt: entry.created_at
              }))
            }))
          })
        })
        .subscribe()
      channels.push(dbtChannel)
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
        // Record update time immediately for all syncs
        lastLocalUpdateRef.current = Date.now()
        
        if (newData.habits.length > 0) {
          console.log('📝 Syncing', newData.habits.length, 'habits to Supabase')
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

        if (newData.strategies.length > 0) {
          console.log('📝 Syncing', newData.strategies.length, 'strategies to Supabase')
          await supabase.from('strategies').upsert(
            newData.strategies.map(s => ({
              id: s.id,
              user_id: userId,
              name: s.name,
              notes: s.notes || null
            }))
          )
        }

        // Delete strategies that no longer exist locally
        const localStrategyIds = new Set(newData.strategies.map(s => s.id))
        const deletedStrategyIds = data.strategies
          .filter(s => !localStrategyIds.has(s.id))
          .map(s => s.id)
        
        if (deletedStrategyIds.length > 0) {
          console.log('🗑️ Deleting strategies:', deletedStrategyIds)
          await supabase
            .from('strategies')
            .delete()
            .in('id', deletedStrategyIds)
        }

        if (newData.tickers.length > 0) {
          console.log('📝 Syncing', newData.tickers.length, 'tickers to Supabase')
          await supabase.from('tickers').upsert(
            newData.tickers.map(t => ({
              id: t.id,
              user_id: userId,
              symbol: t.symbol,
              notes: t.notes || null
            }))
          )
        }

        // Delete tickers that no longer exist locally
        const localTickerIds = new Set(newData.tickers.map(t => t.id))
        const deletedTickerIds = data.tickers
          .filter(t => !localTickerIds.has(t.id))
          .map(t => t.id)
        
        if (deletedTickerIds.length > 0) {
          console.log('🗑️ Deleting tickers:', deletedTickerIds)
          await supabase
            .from('tickers')
            .delete()
            .in('id', deletedTickerIds)
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
          console.log('📝 Syncing', newData.trades.length, 'trades to Supabase:', newData.trades)
          const { error: tradesError } = await supabase.from('trades').upsert(
            newData.trades.map(t => ({
              id: t.id,
              user_id: userId,
              date: t.date,
              ticker: t.ticker,
              strategy: t.strategy,
              direction: t.direction,
              outcome: t.outcome,
              r: t.r,
              note: t.note || null,
              created_at: new Date().toISOString()
            }))
          )
          if (tradesError) {
            console.error('❌ Error syncing trades:', tradesError)
          } else {
            console.log('✅ Trades synced')
          }
        }

        // Delete trades that no longer exist locally
        const localTradeIds = new Set(newData.trades.map(t => t.id))
        const deletedTradeIds = data.trades
          .filter(t => !localTradeIds.has(t.id))
          .map(t => t.id)
        
        if (deletedTradeIds.length > 0) {
          console.log('🗑️ Deleting trades:', deletedTradeIds)
          await supabase
            .from('trades')
            .delete()
            .in('id', deletedTradeIds)
        }

        await supabase.from('pdf_reader').upsert({
          user_id: userId,
          url: newData.pdfReader.url || '',
          current_page: newData.pdfReader.currentPage || 1,
          notes: newData.pdfReader.notes || ''
        }, { onConflict: 'user_id' })

        if (newData.shoppingList.length > 0) {
          console.log('📝 Syncing', newData.shoppingList.length, 'shopping items to Supabase')
          await supabase.from('shopping_list').upsert(
            newData.shoppingList.map(item => ({
              id: item.id,
              user_id: userId,
              text: item.text,
              completed: item.completed,
              created_at: item.createdAt
            }))
          )
        }

        // Delete shopping items that no longer exist locally
        const localShoppingIds = new Set(newData.shoppingList.map(s => s.id))
        const deletedShoppingIds = data.shoppingList
          .filter(s => !localShoppingIds.has(s.id))
          .map(s => s.id)
        
        if (deletedShoppingIds.length > 0) {
          console.log('🗑️ Deleting shopping items:', deletedShoppingIds)
          await supabase
            .from('shopping_list')
            .delete()
            .in('id', deletedShoppingIds)
        }

        if (newData.dbtEntries.length > 0) {
          console.log('📝 Syncing', newData.dbtEntries.length, 'DBT entries to Supabase')
          await supabase.from('dbt_entries').upsert(
            newData.dbtEntries.map(entry => ({
              id: entry.id,
              user_id: userId,
              date: entry.date,
              mood: entry.mood,
              skills: entry.skills,
              notes: entry.notes || '',
              worksheet_url: entry.worksheetUrl || null,
              created_at: entry.createdAt
            }))
          )
        }

        // Delete DBT entries that no longer exist locally
        const localDbtIds = new Set(newData.dbtEntries.map(e => e.id))
        const deletedDbtIds = data.dbtEntries
          .filter(e => !localDbtIds.has(e.id))
          .map(e => e.id)
        
        if (deletedDbtIds.length > 0) {
          console.log('🗑️ Deleting DBT entries:', deletedDbtIds)
          await supabase
            .from('dbt_entries')
            .delete()
            .in('id', deletedDbtIds)
        }
      } catch (err) {
        console.error('Error syncing:', err)
      }
    }

    syncToSupabase()
  }, [data, userId])

  return { data, loading, update, userId }
}
