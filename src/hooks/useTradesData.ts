import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTradesData() {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('trading_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setTrades(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const addTrade = useCallback(async (trade: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('trading_trades')
      .insert({ ...trade, user_id: user.id })
      .select()

    if (data) {
      setTrades([data[0], ...trades])
    }
  }, [trades])

  const deleteTrade = useCallback(async (id: string) => {
    await supabase.from('trading_trades').delete().eq('id', id)
    setTrades(trades.filter(t => t.id !== id))
  }, [trades])

  return { trades, loading, addTrade, deleteTrade }
}