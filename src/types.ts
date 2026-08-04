export type HabitType = 'daily' | 'weekly'
export type HabitStatus = 'active' | 'paused' | 'ended'
export type Color = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'cyan' | 'yellow'

export interface Habit {
  id: string
  name: string
  type: HabitType
  color: Color
  icon: string
  status: HabitStatus
  createdAt: string
  pausedAt?: string
  notes?: string
  currentStreak?: number
  longestStreak?: number
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
  outcome: 'win' | 'loss'
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
