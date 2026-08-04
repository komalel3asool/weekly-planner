import { AppData, WeekData, DayData } from '../types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_COLORS: Record<string, string> = {
  Monday: '#fef3c7',
  Tuesday: '#fde68a',
  Wednesday: '#fcd34d',
  Thursday: '#fbbf24',
  Friday: '#f59e0b'
}

export function getWeekKey(date = new Date()): string {
  const d = new Date(date)
  const dayNum = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dayNum)
  const week = Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 604800000) + 1
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getWeekDates(weekKey: string): { date: string; day: string }[] {
  const [year, week] = weekKey.split('-W').map(Number)
  const d = new Date(year, 0, 4)
  const dayNum = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dayNum + (week - 1) * 7)
  
  return DAYS.map((day, i) => {
    const date = new Date(d)
    date.setDate(date.getDate() + i)
    return {
      day,
      date: date.toISOString().split('T')[0]
    }
  })
}

export function createEmptyWeek(weekKey: string): WeekData {
  const dates = getWeekDates(weekKey)
  const [year, week] = weekKey.split('-W').map(Number)
  
  const days: Record<string, DayData> = {}
  dates.forEach(({ day, date }) => {
    days[day] = {
      date,
      done: [],
      todos: [],
      meetings: [],
      results: [],
      habitLog: {}
    }
  })
  
  return {
    weekKey,
    year,
    week,
    focus: '',
    days
  }
}

export function initializeAppData(): AppData {
  return {
    habits: [],
    weeks: {},
    trades: [],
    pdfReader: { url: '', currentPage: 1, notes: '' },
    focus: ''
  }
}

export function getOrCreateWeek(data: AppData, weekKey: string): WeekData {
  if (!data.weeks[weekKey]) {
    data.weeks[weekKey] = createEmptyWeek(weekKey)
  }
  return data.weeks[weekKey]
}

export { DAYS, DAY_COLORS }
