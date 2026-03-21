import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { fmtTime }     from '../utils/scheduleUtils'
import { readApiResponse } from '../utils/api'
import s from './AdminDashboard.module.css'

const DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const EMPTY = { day: 0, dayName: 'Sunday', startH: 9, startM: 0, endH: 17, endM: 0, overnight: false, active: true }

export default function AdminDashboard() {
  const { schedule: remote, refetch } = useSchedule()

  const [schedule, setSchedule]   = useState(null)
  const [saving,   setSaving]     = useState(false)
  const [editId,   setEditId]     = useState(null)
  const [editForm, setEditForm]   = useState(null)
  const [confirm,  setConfirm]    = useState(null)
  const [toast,    setToast]      = useState(null)
  const [resetting,setResetting]  = useState(false)

  useEffect(() => { if (remote) setSchedule(remote) }, [remote])

  function showToast(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  async function saveAll(sched) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: sched })
      })
      const data = await readApiResponse(res, 'Save failed')
      setSchedule(data.schedule); refetch()
      showToast('✓ SCHEDULE UPDATED')
    } catch (err) {
      showToast(`✗ ${err.message.toUpperCase()}`, 'error')
    }
    finally { setSaving(false) }
  }

  async function handleReset() {
    setConfirm({ msg: 'RESET TO DEFAULT SCHEDULE?', onOk: async () => {
      setResetting(true)
      try {
        const res = await fetch('/api/admin/schedule/reset', { method: 'POST' })
        const data = await readApiResponse(res, 'Reset failed')
        setSchedule(data.schedule); refetch()
        showToast('✓ SCHEDULE RESET')
      } catch (err) {
        showToast(`✗ ${err.message.toUpperCase()}`, 'error')
      }
      finally { setResetting(false); setConfirm(null) }
    }})
  }

  function startEdit(shift) { setEditForm({ ...shift }); setEditId(shift.id) }
  function startNew() {
    const maxId = (schedule || []).reduce((m, x) => Math.max(m, x.id), 0)
    setEditForm({ ...EMPTY, id: maxId + 1 }); setEditId('new')
  }
  function cancelEdit() { setEditId(null); setEditForm(null) }

  function applyEdit() {
    editForm.dayName = DAY_FULL[editForm.day]
    const newSched = editId === 'new'
      ? [...(schedule || []), editForm]
      : (schedule || []).map(x => x.id === editId ? editForm : x)
    setSchedule(newSched); cancelEdit(); saveAll(newSched)
  }

  function deleteShift(id) {
    setConfirm({ msg: 'DELETE THIS SHIFT?', onOk: () => {
      const n = (schedule || []).filter(x => x.id !== id)
      setSchedule(n); saveAll(n); setConfirm(null)
    }})
  }

  function toggleActive(id) {
    const n = (schedule || []).map(x => x.id === id ? { ...x, active: !x.active } : x)
    setSchedule(n); saveAll(n)
  }

  const sorted = (schedule || []).slice().sort((a, b) => a.day - b.day || a.startH - b.startH)
  const totalHrs = sorted.filter(x => x.active).reduce((acc, x) => {
    const mins = x.overnight ? (1440 - (x.startH*60+x.startM)) + (x.endH*60+x.endM) : (x.endH*60+x.endM) - (x.startH*60+x.startM)
    return acc + mins
  }, 0) / 60

  return (
    <div className={s.page}>
      {/* sidebar */}
      <aside className={s.sidebar}>
        <div className={s.sideHeader}>
          <div className={s.sideLogo}>◈ BROTRACKER</div>
          <div className={s.sideVer}>SCHEDULE v2.0</div>
        </div>
        <div className={s.sideUser}>
          <div className={s.sideUserIcon}>🛡</div>
          <div>
            <div className={s.sideUsername}>Schedule Console</div>
            <div className={s.sideRole}>BACKEND CONNECTED</div>
          </div>
          <div className={s.sideOnline} />
        </div>
        <nav className={s.sideNav}>
          <div className={`${s.navItem} ${s.navActive}`}>
            <span className={s.navIcon}>◈</span> SCHEDULE
          </div>
          <Link to="/" className={s.navItem}>
            <span className={s.navIcon}>◉</span> LIVE VIEW
          </Link>
        </nav>
        <Link to="/" className={`btn btn-ghost btn-sm ${s.logoutBtn}`}>
          ◈ RETURN HOME
        </Link>
      </aside>

      {/* main */}
      <main className={s.main}>
        {/* top */}
        <div className={s.topBar}>
          <div>
            <div className={s.pageTitle}>SCHEDULE CONTROL</div>
            <div className={s.pageSub}>MANAGE OPERATIVE DEPLOYMENT TIMES</div>
          </div>
          <div className={s.topActions}>
            <div className={s.statChip}>
              <span className={s.statVal}>{totalHrs.toFixed(1)}H</span>
              <span className={s.statLbl}>/ WEEK</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleReset} disabled={resetting}>
              {resetting ? '⏳' : '⟲'} RESET
            </button>
            <button className="btn btn-primary btn-sm" onClick={startNew}>
              ＋ ADD SHIFT
            </button>
          </div>
        </div>

        {/* shift list */}
        <div className={s.shiftList}>
          {sorted.length === 0 && (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>◎</div>
              <div className={s.emptyText}>NO SHIFTS CONFIGURED</div>
              <button className="btn btn-primary btn-sm" onClick={startNew}>＋ ADD FIRST SHIFT</button>
            </div>
          )}
          {sorted.map((sh, i) => (
            <div key={sh.id} className={`${s.shiftCard} ${!sh.active ? s.inactive : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              {/* left accent bar */}
              <div className={s.shiftAccent} style={{ background: sh.active ? 'var(--neon-pink)' : 'var(--text-dim)' }} />

              <div className={s.shiftInfo}>
                <div className={s.shiftDay}>{sh.dayName || DAY_FULL[sh.day]}</div>
                <div className={s.shiftTime}>
                  {fmtTime(sh.startH, sh.startM)}
                  <span className={s.shiftArrow}>→</span>
                  {fmtTime(sh.endH, sh.endM)}
                  {sh.overnight && <span className={s.overnightTag}>+1D</span>}
                </div>
                {!sh.active && <span className={s.pausedTag}>PAUSED</span>}
              </div>

              <div className={s.shiftMeta}>
                <span className={s.shiftHrs}>
                  {(() => {
                    const mins = sh.overnight
                      ? (1440 - (sh.startH*60+sh.startM)) + (sh.endH*60+sh.endM)
                      : (sh.endH*60+sh.endM) - (sh.startH*60+sh.startM)
                    return `${(mins/60).toFixed(1)}H`
                  })()}
                </span>
              </div>

              <div className={s.shiftActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(sh.id)}>
                  {sh.active ? '⏸ PAUSE' : '▶ RESUME'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(sh)}>
                  ✎ EDIT
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteShift(sh.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {saving && (
          <div className={s.savingBar}>
            <span className={s.savingSpinner} />
            SYNCING TO SERVER…
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editId !== null && editForm && (
        <div className={s.overlay} onClick={cancelEdit}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalTop}>
              <span className={s.modalTitle}>{editId === 'new' ? '＋ NEW SHIFT' : '✎ EDIT SHIFT'}</span>
              <button className={s.modalClose} onClick={cancelEdit}>✕</button>
            </div>

            <div className={s.formGrid}>
              <FormField label="DAY OF WEEK">
                <select className={s.select} value={editForm.day}
                  onChange={e => setEditForm(f => ({ ...f, day: +e.target.value, dayName: DAY_FULL[+e.target.value] }))}>
                  {DAY_FULL.map((d,i) => <option key={i} value={i}>{d.toUpperCase()}</option>)}
                </select>
              </FormField>

              <div className={s.twoCol}>
                <FormField label="START TIME">
                  <div className={s.timeRow}>
                    <input className={s.timeInput} type="number" min="0" max="23"
                      value={editForm.startH} onChange={e => setEditForm(f => ({ ...f, startH: +e.target.value }))} />
                    <span className={s.timeSep}>:</span>
                    <input className={s.timeInput} type="number" min="0" max="59" step="5"
                      value={editForm.startM} onChange={e => setEditForm(f => ({ ...f, startM: +e.target.value }))} />
                  </div>
                </FormField>
                <FormField label="END TIME">
                  <div className={s.timeRow}>
                    <input className={s.timeInput} type="number" min="0" max="23"
                      value={editForm.endH} onChange={e => setEditForm(f => ({ ...f, endH: +e.target.value }))} />
                    <span className={s.timeSep}>:</span>
                    <input className={s.timeInput} type="number" min="0" max="59" step="5"
                      value={editForm.endM} onChange={e => setEditForm(f => ({ ...f, endM: +e.target.value }))} />
                  </div>
                </FormField>
              </div>

              <div className={s.checkRow}>
                <label className={s.checkLabel}>
                  <input type="checkbox" checked={editForm.overnight}
                    onChange={e => setEditForm(f => ({ ...f, overnight: e.target.checked }))} />
                  <span>OVERNIGHT SHIFT (ENDS NEXT DAY)</span>
                </label>
                <label className={s.checkLabel}>
                  <input type="checkbox" checked={editForm.active}
                    onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} />
                  <span>ACTIVE</span>
                </label>
              </div>
            </div>

            <div className={s.modalActions}>
              <button className="btn btn-ghost" onClick={cancelEdit}>CANCEL</button>
              <button className="btn btn-primary" onClick={applyEdit} disabled={saving}>
                {saving ? '⏳ SAVING…' : '◈ SAVE SHIFT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className={s.overlay} onClick={() => setConfirm(null)}>
          <div className={`${s.modal} ${s.confirmModal}`} onClick={e => e.stopPropagation()}>
            <div className={s.confirmIcon}>⚠</div>
            <div className={s.confirmMsg}>{confirm.msg}</div>
            <div className={s.modalActions}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>ABORT</button>
              <button className="btn btn-danger" onClick={confirm.onOk}>CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${s.toast} ${toast.type === 'error' ? s.toastErr : s.toastOk}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', color: 'var(--text-dim)', letterSpacing: '2px' }}>{label}</label>
      {children}
    </div>
  )
}
