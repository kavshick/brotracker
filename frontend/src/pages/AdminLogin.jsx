import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import s from './AdminLogin.module.css'

export default function AdminLogin() {
  const { login, isAdmin, adminUser, logout } = useAuth()
  const nav = useNavigate()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [attempts,setAttempts]= useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.username, form.password)
      nav('/admin/dash', { replace: true })
    } catch (err) {
      setAttempts(a => a + 1)
      setError(err.message || 'ACCESS DENIED')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      {/* background grid lines decoration */}
      <div className={s.bgDeco} />

      <div className={s.terminal}>
        {/* terminal top bar */}
        <div className={s.termBar}>
          <span className={s.termDot} style={{ background: '#ff5f57' }} />
          <span className={s.termDot} style={{ background: '#ffbd2e' }} />
          <span className={s.termDot} style={{ background: '#28c840' }} />
          <span className={s.termTitle}>BROTRACKER — SECURE SHELL</span>
        </div>

        {/* boot sequence */}
        <div className={s.bootLog}>
          <div className={s.bootLine}><span className={s.bl}>SYSTEM</span> BroTracker Admin Portal v2.0</div>
          <div className={s.bootLine}><span className={s.bl}>STATUS</span> Secure Channel Established</div>
          <div className={s.bootLine}>
            <span className={s.bl}>AUTH  </span> {isAdmin ? 'Session active' : 'Awaiting credentials...'}
          </div>
          {attempts > 0 && (
            <div className={`${s.bootLine} ${s.bootErr}`}>
              <span className={s.bl}>WARN  </span> {attempts} failed attempt{attempts > 1 ? 's' : ''} detected
            </div>
          )}
        </div>

        {isAdmin && (
          <div className={s.errorRow} style={{ margin: '0 20px', borderColor: 'rgba(57,255,20,.3)', background: 'rgba(57,255,20,.08)' }}>
            <span className={s.errorPrefix} style={{ color: 'var(--neon-green)' }}>ACTIVE:</span>
            <span className={s.errorMsg} style={{ color: 'var(--neon-green)' }}>
              Logged in as {adminUser || 'admin'}
            </span>
            <button type="button" className={`btn btn-ghost btn-sm`} onClick={() => nav('/admin/dash', { replace: true })}>
              OPEN DASHBOARD
            </button>
            <button type="button" className={`btn btn-danger btn-sm`} onClick={logout}>
              LOGOUT
            </button>
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.fieldRow}>
            <span className={s.fieldPrefix}>user@brotracker:~$</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="text"
                placeholder="USERNAME"
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
              <span className={s.inputCursor} />
            </div>
          </div>
          <div className={s.fieldRow}>
            <span className={s.fieldPrefix}>passwd:~$</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type={showPw ? 'text' : 'password'}
                placeholder="PASSWORD"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button type="button" className={s.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? '◎' : '●'}
              </button>
            </div>
          </div>

          {error && (
            <div className={s.errorRow}>
              <span className={s.errorPrefix}>ERROR:</span>
              <span className={s.errorMsg}>{error}</span>
            </div>
          )}

          <div className={s.submitRow}>
            <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={loading}>
              {loading ? (
                <><span className={s.spinner} /> AUTHENTICATING…</>
              ) : (
                <>◈ AUTHENTICATE</>
              )}
            </button>
          </div>
        </form>

        <div className={s.termFooter}>
          <Link to="/" className={s.backLink}>← EXIT TO TRACKER</Link>
          <span className={s.termVersion}>BROTRACKER v2.0</span>
        </div>
      </div>
    </div>
  )
}
