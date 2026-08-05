import { Database } from '@supabase/supabase-js'

export interface Habit {
  id: string
  name: string
  type: 'daily' | 'weekly'
  icon: string
  color: string
  status: 'active' | 'paused' | 'ended'
  createdAt: string
  currentStreak: number
  longestStreak: number
  target?: number // NEW: target count for daily habits
  notes?: string
  pausedAt?: string
}

export interface TodoItem {
  text: string
  completed: boolean
}

export interface DayData {
  date: string
  done: string[]
  todos: TodoItem[]
  meetings: string[]
  results: string[]
  habitLog: Record<string, { count: number; notes?: string }>
}

export interface WeekData {
  weekKey: string
  year: number
  week: number
  focus: string
  days: Record<string, DayData>
}

export interface Strategy {
  id: string
  name: string
  notes?: string
}

export interface Ticker {
  id: string
  symbol: string
  notes?: string
}

export interface Trade {
  id: string
  date: string
  ticker: string
  strategy: string
  direction: 'long' | 'short'
  outcome: 'win' | 'loss' | 'breakeven'
  r: number
  note?: string
}

export interface PdfReader {
  url: string
  currentPage: number
  notes: string
}

export interface ShoppingItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export interface AppData {
  habits: Habit[]
  strategies: Strategy[]
  tickers: Ticker[]
  weeks: Record<string, WeekData>
  trades: Trade[]
  pdfReader: PdfReader
  shoppingList: ShoppingItem[]
  focus: string
}
