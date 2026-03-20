import { useState, useEffect, useCallback } from 'react'

// Fallback schedule if backend is unreachable
const FALLBACK = [
  { id:1, day:1, dayName:'Monday',    startH:12,startM:0,  endH:7, endM:0,  overnight:true,  active:true },
  { id:2, day:2, dayName:'Tuesday',   startH:17,startM:0,  endH:23,endM:0,  overnight:false, active:true },
  { id:3, day:3, dayName:'Wednesday', startH:17,startM:0,  endH:23,endM:0,  overnight:false, active:true },
  { id:4, day:4, dayName:'Thursday',  startH:16,startM:30, endH:21,endM:30, overnight:false, active:true },
  { id:5, day:5, dayName:'Friday',    startH:13,startM:0,  endH:19,endM:0,  overnight:false, active:true },
  { id:6, day:6, dayName:'Saturday',  startH:7, startM:0,  endH:15,endM:0,  overnight:false, active:true },
]

export function useSchedule() {
  const [schedule,  setSchedule]  = useState(FALLBACK)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [offline,   setOffline]   = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const res  = await fetch('/api/schedule')
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setSchedule(data.schedule)
      setUpdatedAt(data.updatedAt)
      setOffline(false)
    } catch {
      setOffline(true)
      // Keep last known schedule (or fallback)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const iv = setInterval(fetch_, 60000) // re-fetch every 60s
    return () => clearInterval(iv)
  }, [fetch_])

  return { schedule, loading, error, updatedAt, offline, refetch: fetch_ }
}
