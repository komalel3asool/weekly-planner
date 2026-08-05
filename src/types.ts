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

export interface DayData {
  date: string
  done: string[]
  todos: string[]
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

export interface AppData {
  habits: Habit[]
  weeks: Record<string, WeekData>
  trades: Trade[]
  pdfReader: PdfReader
  focus: string
}
