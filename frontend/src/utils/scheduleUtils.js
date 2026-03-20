export const BRO_TZ = 'America/Toronto'
export const MY_TZ  = 'Asia/Kolkata'

export const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT']
export const DAY_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function nowIn(tz) {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
}

export function toMin(h, m) { return h * 60 + m }

export function fmtTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh   = h % 12 || 12
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`
}

export function fmtClock(date, tz) {
  return date.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true })
}

export function fmtDate(date, tz) {
  return date.toLocaleDateString('en-IN', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' })
}

export function timeDiffLabel(broNow, myNow) {
  const diffMin = Math.round((myNow - broNow) / 60000)
  const h = Math.floor(Math.abs(diffMin) / 60)
  const m = Math.abs(diffMin) % 60
  const sign = diffMin >= 0 ? '+' : '-'
  return `${sign}${h}h${m > 0 ? m + 'm' : ''}`
}

export function countdownStr(targetDate) {
  const diff = Math.max(0, Math.floor((targetDate - new Date()) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// Returns { working, shift, progress, endsAt }
export function getStatus(schedule, broNow) {
  const day = broNow.getDay()
  const cur = toMin(broNow.getHours(), broNow.getMinutes())

  for (const s of schedule) {
    if (!s.active) continue
    const sMin = toMin(s.startH, s.startM)
    const eMin = toMin(s.endH,   s.endM)

    if (s.day === day) {
      if (s.overnight) {
        if (cur >= sMin || cur < eMin) {
          const total   = (1440 - sMin) + eMin
          const elapsed = cur >= sMin ? cur - sMin : (1440 - sMin) + cur
          return { working: true, shift: s, progress: Math.round((elapsed/total)*100), endsAt: eMin }
        }
      } else {
        if (cur >= sMin && cur < eMin) {
          return {
            working: true, shift: s,
            progress: Math.round(((cur - sMin)/(eMin - sMin))*100),
            endsAt: eMin
          }
        }
      }
    }

    // Overnight bleed-into-next-day
    if (s.overnight && (s.day + 1) % 7 === day) {
      const eMin2 = toMin(s.endH, s.endM)
      if (cur < eMin2) {
        const sMin2 = toMin(s.startH, s.startM)
        const total = (1440 - sMin2) + eMin2
        const elapsed = (1440 - sMin2) + cur
        return { working: true, shift: s, progress: Math.round((elapsed/total)*100), endsAt: eMin2 }
      }
    }
  }
  return { working: false }
}

// Returns Date of next free moment (Ontario time)
export function getNextFreeStart(schedule, broNow) {
  for (let offset = 5; offset <= 14*1440; offset += 5) {
    const check = new Date(broNow.getTime() + offset * 60000)
    const { working } = getStatus(schedule, check)
    if (!working) return check
  }
  return null
}

// Returns Date of next shift start (Ontario time)
export function getNextShiftStart(schedule, broNow) {
  for (let offset = 5; offset <= 14*1440; offset += 5) {
    const check = new Date(broNow.getTime() + offset * 60000)
    const { working } = getStatus(schedule, check)
    if (working) return check
  }
  return null
}

// Convert BroNow (Ontario date) to real UTC for countdown
export function broDateToReal(broNow, targetBroDate) {
  // offset between real time and bro time
  const real = new Date()
  const diff = real - broNow          // ms offset (real - bro)
  return new Date(targetBroDate.getTime() + diff)
}
