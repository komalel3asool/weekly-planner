import React from 'react'

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

export function useDebounce<T>(value: T, delay: number): [T, (newValue: T) => void] {
  const [debouncedValue, setDebouncedValue] = React.useState(value)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleSetValue = (newValue: T) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setDebouncedValue(newValue)
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue)
    }, delay)
  }

  return [debouncedValue, handleSetValue]
}
