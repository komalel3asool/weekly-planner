import { useState, useEffect, useCallback } from 'react'
import { AppData } from '../types'
import { initializeAppData } from '../utils/weekUtils'

const STORAGE_KEY = 'weekly-planner-data'

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : initializeAppData()
    } catch {
      return initializeAppData()
    }
  })

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData(d => fn(d))
  }, [])

  return { data, update }
}
