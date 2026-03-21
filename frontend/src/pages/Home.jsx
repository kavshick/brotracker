import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import {
  BRO_TZ, MY_TZ,
  nowIn, fmtTime, fmtClock, fmtDate, timeDiffLabel, countdownStr,
  getStatus, getNextFreeStart, getNextShiftStart, broDateToReal, DAY_NAMES
} from '../utils/scheduleUtils'
import s from './Home.module.css'

function useTick(ms = 1000) {
  const [, set] = useState(0)
  useEffect(() => { const iv = setInterval(() => set(t => t + 1), ms); return () => clearInterval(iv) }, [ms])
}

const DAY_FULL = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']

/* ── Animated background particles ── */
function Particles() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let animId
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .4,
      vy: (Math.random() - .5) * .4,
      size: Math.random() * 1.5 + .3,
      color: Math.random() > .5 ? '#00fff520' : '#ff006e18',
    }))
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className={s.particles} />
}

/* ── Radar ring animation ── */
function RadarRing({ state }) {
  const color = state === 'free' ? '#39ff14' : state === 'work' ? '#ff006e' : '#ffe600'
  return (
    <div className={s.radarWrap}>
      <div className={s.radarRing1} style={{ '--rc': color }} />
      <div className={s.radarRing2} style={{ '--rc': color }} />
      <div className={s.radarRing3} style={{ '--rc': color }} />
      <div className={s.radarSweep} style={{ '--rc': color }} />
    </div>
  )
}

/* ── Hex status ── */
function HexStatus({ state, emoji }) {
  const colors = { free: '#39ff14', work: '#ff006e', soon: '#ffe600' }
  const c = colors[state]
  return (
    <div className={s.hexWrap}>
      <svg className={s.hexSvg} viewBox="0 0 120 138" fill="none">
        <polygon
          points="60,4 114,33 114,105 60,134 6,105 6,33"
          stroke={c} strokeWidth="1.5"
          fill={`${c}08`}
          className={s.hexPoly}
        />
        <polygon
          points="60,14 104,39 104,99 60,124 16,99 16,39"
          stroke={`${c}40`} strokeWidth="1"
          fill="none"
        />
      </svg>
      <span className={s.hexEmoji}>{emoji}</span>
    </div>
  )
}

/* ── Glitch text ── */
function GlitchText({ children, className }) {
  return (
    <span className={`${s.glitchText} ${className || ''}`} data-text={children}>
      {children}
    </span>
  )
}

/* ── Data ticker ── */
function DataTicker() {
  const items = [
    'SYS:ONLINE', 'PING:OK', 'TIMEZONE:IST+9.5/EST', 'REFRESH:1S',
    'SCHEDULE:SYNCED', 'UPTIME:99.9%', 'SIGNAL:STRONG', 'BACKEND:LIVE',
  ]
  const doubled = [...items, ...items]
  return (
    <div className={s.tickerWrap}>
      <div className={s.tickerTrack}>
        {doubled.map((item, i) => (
          <span key={i} className={s.tickerItem}>◈ {item}</span>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  useTick()
  const { schedule, loading, offline } = useSchedule()

  const now    = new Date()
  const broNow = nowIn(BRO_TZ)
  const myNow  = nowIn(MY_TZ)

  const { working, shift, progress } = getStatus(schedule, broNow)

  const nextFree  = !working ? null : getNextFreeStart(schedule, broNow)
  const nextShift = working  ? null : getNextShiftStart(schedule, broNow)

  const endingSoon   = working && nextFree  && (broDateToReal(broNow, nextFree)  - now) < 45*60000
  const startingSoon = !working && nextShift && (broDateToReal(broNow, nextShift) - now) < 45*60000

  const state = working ? (endingSoon ? 'soon' : 'work') : (startingSoon ? 'soon' : 'free')
  const nextTarget = working
    ? (nextFree  ? broDateToReal(broNow, nextFree)  : null)
    : (nextShift ? broDateToReal(broNow, nextShift) : null)

  const STATUS_CFG = {
    free: { emoji: '🧑‍🎮', label: 'AVAILABLE',    sublabel: 'READY TO GAME',   color: '#39ff14', tagline: 'CHANNEL OPEN — INITIATE CONTACT' },
    work: { emoji: '💼',    label: 'ON MISSION',   sublabel: 'DO NOT DISTURB',  color: '#ff006e', tagline: 'TARGET ENGAGED — STAND BY' },
    soon: working
      ? { emoji: '⏱',   label: 'RETURNING',    sublabel: 'MISSION ENDING',  color: '#ffe600', tagline: 'PREPARE FOR CONTACT' }
      : { emoji: '⚠️',  label: 'DEPLOYING',    sublabel: 'SHIFT INCOMING',  color: '#ffe600', tagline: 'WINDOW CLOSING SOON' },
  }
  const cfg = STATUS_CFG[state]

  return (
    <div className={s.page}>
      <Particles />

      {/* corner decorations */}
      <div className={`${s.corner} ${s.cornerTL}`} />
      <div className={`${s.corner} ${s.cornerTR}`} />
      <div className={`${s.corner} ${s.cornerBL}`} />
      <div className={`${s.corner} ${s.cornerBR}`} />

      {/* Ticker */}
      <DataTicker />

      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.logoRow}>
            <span className={s.logoIcon}>◈</span>
            <GlitchText className={s.logo}>BROTRACKER</GlitchText>
            <span className={s.logoBadge}>v2.0</span>
          </div>
          <div className={s.headerSub}>REAL-TIME OPERATIVE STATUS SYSTEM &nbsp;·&nbsp; 🇮🇳 ↔ 🇨🇦</div>
        </div>
        <div className={s.headerRight}>
          {offline && <span className={s.offlineTag}>⚡ OFFLINE MODE</span>}
        </div>
      </header>

      {/* Main grid */}
      <div className={s.mainGrid}>

        {/* LEFT: Status panel */}
        <div className={s.statusColumn}>

          {/* Big status card */}
          <div className={`${s.statusCard} ${s[`sc_${state}`]}`}>
            <div className={s.scScanline} />
            {/* top bar */}
            <div className={s.scTopBar}>
              <span className={s.scTopLabel}>OPERATIVE STATUS</span>
              <span className={s.scTopRight}>
                <span className={s.blinkDot} style={{ background: cfg.color }} />
                LIVE
              </span>
            </div>

            {/* center */}
            <div className={s.scCenter}>
              <RadarRing state={state} />
              <HexStatus state={state} emoji={cfg.emoji} />
            </div>

            <div className={s.scLabel} style={{ '--c': cfg.color }}>
              {cfg.label}
            </div>
            <div className={s.scSublabel} style={{ color: cfg.color }}>
              {cfg.sublabel}
            </div>
            <div className={s.scTagline}>{cfg.tagline}</div>

            {/* Zap line */}
            <div className={s.zapLine} style={{ background: cfg.color }} />
          </div>

          {/* Progress bar (during shift) */}
          {working && (
            <div className={`${s.progressCard} ${s[`sc_${state}`]}`}>
              <div className={s.progressHeader}>
                <span className={s.progressLabel}>MISSION PROGRESS</span>
                <span className={s.progressPct} style={{ color: cfg.color }}>{progress}%</span>
              </div>
              <div className={s.progressTrack}>
                <div className={s.progressFill} style={{ width: `${progress}%`, background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
                <div className={s.progressGlow} style={{ left: `${progress}%`, background: cfg.color }} />
              </div>
              <div className={s.progressMeta}>
                <span>{fmtTime(shift.startH, shift.startM)}</span>
                <span style={{ color: 'var(--text-dim)' }}>EST. END</span>
                <span>{fmtTime(shift.endH, shift.endM)}{shift.overnight ? ' +1' : ''}</span>
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className={s.countdownCard}>
            <div className={s.cdLabel}>{working ? '⏱ FREE IN' : '📡 NEXT SHIFT'}</div>
            <div className={s.cdTimer} style={{ color: cfg.color }}>
              {nextTarget ? countdownStr(nextTarget) : '—'}
            </div>
            <div className={s.cdSub}>
              {working
                ? `RETURNING AT ${nextFree ? fmtClock(nextFree, BRO_TZ) : '?'} ONTARIO`
                : `DEPLOYING AT ${nextShift ? fmtClock(nextShift, BRO_TZ) : '?'} ONTARIO`
              }
            </div>
          </div>

          {/* CTA */}
          <div className={s.ctaRow}>
            {working && !endingSoon ? (
              <button className={`btn btn-ghost ${s.ctaBtn}`} disabled style={{ opacity: .4 }}>
                ◈ TARGET UNAVAILABLE
              </button>
            ) : (
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className={`btn btn-primary ${s.ctaBtn}`}>
                ◈ OPEN COMM CHANNEL
              </a>
            )}
          </div>
        </div>

        {/* RIGHT: Info panels */}
        <div className={s.infoColumn}>

          {/* Dual clock */}
          <div className={s.clockPanel}>
            <div className={s.panelTitle}><span className={s.panelDot} />CLOCK SYNC</div>
            <div className={s.clockGrid}>
              <ClockZone flag="🇮🇳" zone="IST" label="YOUR LOCATION" tz={MY_TZ} accent="var(--neon-cyan)" />
              <div className={s.clockDivider}>
                <span className={s.clockDiff}>{timeDiffLabel(broNow, myNow)}</span>
                <span className={s.clockDiffLabel}>OFFSET</span>
              </div>
              <ClockZone flag="🇨🇦" zone="EST" label="BRO'S LOCATION" tz={BRO_TZ} accent="var(--neon-pink)" />
            </div>
          </div>

          {/* Week schedule */}
          <div className={s.schedPanel}>
            <div className={s.panelTitle}><span className={s.panelDot} />WEEKLY DEPLOYMENT SCHEDULE</div>
            {loading
              ? <div className={s.loadingTxt}>LOADING SCHEDULE DATA…</div>
              : (
                <div className={s.schedGrid}>
                  {[0,1,2,3,4,5,6].map(d => {
                    const sh    = schedule.find(x => x.day === d && x.active)
                    const today = d === broNow.getDay()
                    return (
                      <div key={d} className={`${s.schedRow} ${sh ? s.schedWork : s.schedFree} ${today ? s.schedToday : ''}`}>
                        <span className={s.schedDay}>{DAY_NAMES[d]}{today ? '★' : ''}</span>
                        <div className={s.schedBar}>
                          {sh && <div className={s.schedBarFill} style={{ width: '100%', background: sh.active ? '#ff006e30' : '#333' }} />}
                        </div>
                        <span className={s.schedTime}>
                          {sh ? `${fmtTime(sh.startH,sh.startM)}–${fmtTime(sh.endH,sh.endM)}${sh.overnight?'+1':''}` : 'OFF DUTY'}
                        </span>
                        <span className={`${s.schedBadge} ${sh ? s.badgeWork : s.badgeFree}`}>
                          {sh ? 'WORK' : 'FREE'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>

          {/* Sys log */}
          <div className={s.logPanel}>
            <div className={s.panelTitle}><span className={s.panelDot} />SYSTEM LOG</div>
            <div className={s.logBody}>
              <LogLine time={fmtClock(now, MY_TZ)} msg={`STATUS POLLED — ${cfg.label}`} color={cfg.color} />
              <LogLine time={fmtClock(now, MY_TZ)} msg={`BRO TIME: ${fmtClock(now, BRO_TZ)}`} color="var(--neon-cyan)" />
              {offline && <LogLine time={fmtClock(now, MY_TZ)} msg="BACKEND OFFLINE — CACHED SCHEDULE" color="var(--soon)" />}
              {working && <LogLine time={fmtClock(now, MY_TZ)} msg={`SHIFT ${progress}% COMPLETE`} color="var(--neon-orange)" />}
              <LogLine time={fmtClock(now, MY_TZ)} msg="SYSTEM NOMINAL — ALL CHANNELS ACTIVE" color="var(--text-dim)" />
            </div>
          </div>
        </div>
      </div>

      <footer className={s.footer}>
        <span>◈ BROTRACKER SYSTEM v2.0</span>
        <span>REFRESH: 1S &nbsp;·&nbsp; SCHEDULE SYNC: 60S</span>
        <span>🇮🇳 TN → ON 🇨🇦</span>
      </footer>

      <Link to="/schedule" className={s.scheduleDot} aria-label="Open schedule editor" title="Open schedule editor" />
    </div>
  )
}

function ClockZone({ flag, zone, label, tz, accent }) {
  const now = new Date()
  return (
    <div className={s.clockZone}>
      <div className={s.czFlag}>{flag}</div>
      <div className={s.czTime} style={{ color: accent }}>{fmtClock(now, tz)}</div>
      <div className={s.czZone}>{zone}</div>
      <div className={s.czDate}>{fmtDate(now, tz)}</div>
      <div className={s.czLabel}>{label}</div>
    </div>
  )
}

function LogLine({ time, msg, color }) {
  return (
    <div className={s.logLine}>
      <span className={s.logTime}>{time}</span>
      <span className={s.logArrow} style={{ color }}>▶</span>
      <span className={s.logMsg} style={{ color }}>{msg}</span>
    </div>
  )
}
