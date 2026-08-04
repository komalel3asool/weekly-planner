#!/bin/bash

cd ~/Downloads/weekly-planner

echo "Creating hooks with Python..."

python3 << 'PYEND'
import os

os.makedirs('src/hooks', exist_ok=True)

# useTradesData.ts
trades_code = """import { useState, useEffect, useCallback } from 'react'
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
}"""

with open('src/hooks/useTradesData.ts', 'w') as f:
    f.write(trades_code)

# useGymData.ts
gym_code = """import { useState, useEffect, useCallback } from 'react'
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
}"""

with open('src/hooks/useGymData.ts', 'w') as f:
    f.write(gym_code)

print('✅ Hooks created successfully!')
PYEND

echo ""
echo "✅ Done!"
echo ""
echo "Next: Go to https://app.supabase.com/project/saopexcptpswgbdoslby/sql and run the SQL"
