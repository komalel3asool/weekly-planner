import { useState, useEffect, useCallback } from 'react'
import { AppData } from '../types'
import { initializeAppData } from '../utils/weekUtils'
import { DUMMY_DATA } from '../utils/dummyData'

const STORAGE_KEY = 'weekly-planner-data'
const INITIALIZED_KEY = 'weekly-planner-initialized'

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      // Check if already initialized
      const isInitialized = localStorage.getItem(INITIALIZED_KEY)
      
      if (isInitialized) {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : initializeAppData()
      }
      
      // First load - use dummy data
      localStorage.setItem(INITIALIZED_KEY, 'true')
      return DUMMY_DATA as AppData
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
