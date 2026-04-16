import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../API/firebase'
import { supabase } from '../API/supabase'
import './profile.css'

// ─── Config ───────────────────────────────────────────────────────────────────

const PAPEL_CONFIG = {
  guro:       { label: 'Guro',       className: 'prof-badge--guro' },
  manunulat:  { label: 'Manunulat',  className: 'prof-badge--manunulat' },
  estudyante: { label: 'Estudyante', className: 'prof-badge--estudyante' },
  tagasuri:   { label: 'Tagasuri',   className: 'prof-badge--tagasuri' },
}

const STATUS_COLORS = {
  completed:      { bg: '#10B98122', text: '#34d399', border: '#10B98144' },
  pending_review: { bg: '#F59E0B22', text: '#fbbf24', border: '#F59E0B44' },
  in_progress:    { bg: '#3B82F622', text: '#60a5fa', border: '#3B82F644' },
}
const STATUS_LABELS = {
  completed:      'Tapos na',
  pending_review: 'Para sa Pagsusuri',
  in_progress:    'In Progress',
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName({ username }) {
  const errors = {}
  const v = username.trim()
  if (!v)              errors.username = 'Kailangan ang username.'
  else if (v.length < 2)   errors.username = 'Minimum 2 karakter.'
  else if (v.length > 30)  errors.username = 'Maximum 30 karakter.'
  return errors
}

function validatePass({ current, next, confirm }) {
  const errors = {}
  if (!current)             errors.current = 'Ilagay ang kasalukuyang password.'
  if (!next)                errors.next    = 'Ilagay ang bagong password.'
  else if (next.length < 8) errors.next    = 'Minimum 8 karakter.'
  if (next !== confirm)     errors.confirm = 'Hindi tugma ang mga password.'
  return errors
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PapelBadge({ papel }) {
  if (!papel) return null
  const config = PAPEL_CONFIG[papel] ?? { label: papel, className: 'prof-badge--default' }
  return <span className={`prof-badge ${config.className}`}>{config.label}</span>
}

function Avatar({ name }) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return <div className="prof-avatar" aria-hidden="true">{initials}</div>
}

function Field({ label, error, children }) {
  return (
    <div className="prof-field">
      <label className="prof-label">{label}</label>
      {children}
      {error && <span className="prof-field-error" role="alert">{error}</span>}
    </div>
  )
}

function PassInput({ id, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="prof-input-wrap">
      <span className="prof-input-icon"><LockIcon /></span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="prof-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="prof-eye"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Itago' : 'Ipakita'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

// ─── Quiz Summary Section ─────────────────────────────────────────────────────

function QuizSection({ userId }) {
  const [attempts, setAttempts] = useState([])
  const [loadingQ, setLoadingQ] = useState(true)

  const fetchAttempts = useCallback(async () => {
    if (!userId) { setLoadingQ(false); return }
    setLoadingQ(true)
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        id, score, total_questions, status, finished_at,
        quiz_sets ( title )
      `)
      .eq('user_uid', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })

    if (!error) setAttempts(data ?? [])
    setLoadingQ(false)
  }, [userId])

  useEffect(() => { fetchAttempts() }, [fetchAttempts])

  // Derived stats
  const totalTaken = attempts.length

  const avgScore = totalTaken > 0
    ? (attempts.reduce((sum, a) => {
        const pct = a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0
        return sum + pct
      }, 0) / totalTaken).toFixed(0) + '%'
    : '—'

  const passCount = attempts.filter(
    a => a.total_questions > 0 && (a.score / a.total_questions) >= 0.6
  ).length
  const passRate = totalTaken > 0
    ? ((passCount / totalTaken) * 100).toFixed(0) + '%'
    : '—'

  const highestScore = totalTaken > 0
    ? Math.max(...attempts.map(a =>
        a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0
      )) + '%'
    : '—'

  return (
    <div className="prof-section prof-section--quiz" style={{ animationDelay: '160ms' }}>
      <div className="prof-section-header">
        <div className="prof-section-header-left">
          <span className="prof-section-icon prof-section-icon--blue">
            <QuizIcon />
          </span>
          <h2 className="prof-section-title">Talaan ng mga Pagsusulit</h2>
        </div>
        <span className="prof-section-badge">
          {loadingQ
            ? 'Naglo-load…'
            : totalTaken === 0
              ? 'Walang datos'
              : `${totalTaken} na pagsusulit`}
        </span>
      </div>

      {/* Stats grid */}
      <div className="prof-quiz-grid">
        {[
          { label: 'Mga Sinagutan',    val: loadingQ ? '…' : (totalTaken || '—'), gold: true  },
          { label: 'Karaniwang Marka', val: loadingQ ? '…' : avgScore,            green: true },
          { label: 'Pinakamataas',     val: loadingQ ? '…' : highestScore                     },
          { label: 'Passing Rate',     val: loadingQ ? '…' : passRate                         },
        ].map(s => (
          <div className="prof-quiz-stat" key={s.label}>
            <div className="prof-quiz-stat-label">{s.label}</div>
            <div className={`prof-quiz-stat-val${s.gold ? ' prof-quiz-stat-val--gold' : s.green ? ' prof-quiz-stat-val--green' : ''}`}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Attempts list */}
      {loadingQ ? (
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '2rem 0', color: 'var(--mist, #888)', fontSize: 13,
        }}>
          Naglo-load…
        </div>
      ) : attempts.length > 0 ? (
        <>
          <div className="prof-quiz-table-header">
            <span className="prof-quiz-table-col">Pamagat ng Pagsusulit</span>
            <span className="prof-quiz-table-col">Marka</span>
            <span className="prof-quiz-table-col">Resulta</span>
            <span className="prof-quiz-table-col">Petsa</span>
          </div>

          {attempts.map(a => {
            const pct    = a.total_questions > 0
              ? Math.round((a.score / a.total_questions) * 100)
              : 0
            const passed = pct >= 60
            const sc     = STATUS_COLORS[a.status] ?? STATUS_COLORS.completed
            const date   = a.finished_at
              ? new Date(a.finished_at).toLocaleDateString('fil-PH', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
              : '—'

            return (
              <div key={a.id} className="prof-quiz-row">
                <span className="prof-quiz-row-title">
                  {a.quiz_sets?.title ?? '—'}
                </span>
                <span className="prof-quiz-row-score">
                  {a.score}/{a.total_questions}
                  <span style={{ fontSize: 11, color: 'var(--mist, #888)', marginLeft: 4 }}>
                    ({pct}%)
                  </span>
                </span>
                <span>
                  {a.status === 'pending_review' ? (
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 11,
                      fontWeight: 600, whiteSpace: 'nowrap',
                      background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                    }}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  ) : (
                    <span className={`prof-quiz-row-pill prof-quiz-row-pill--${passed ? 'pass' : 'fail'}`}>
                      {passed ? 'Pumasa' : 'Bumagsak'}
                    </span>
                  )}
                </span>
                <span className="prof-quiz-row-date">{date}</span>
              </div>
            )
          })}
        </>
      ) : (
        <div className="prof-quiz-empty">
          <div className="prof-quiz-empty-icon"><QuizIcon /></div>
          <p className="prof-quiz-empty-text">Walang pagsusulit pa</p>
          <p className="prof-quiz-empty-sub">Ang inyong mga resulta ay lilitaw dito.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage({ onNotify }) {
  const navigate = useNavigate()
  const user     = auth.currentUser
  const nameRef  = useRef(null)

  const [papel,     setPapel]     = useState(null)
  const [nameForm,  setNameForm]  = useState({ username: user?.displayName || '' })
  const [nameErr,   setNameErr]   = useState({})
  const [nameBusy,  setNameBusy]  = useState(false)
  const [nameShake, setNameShake] = useState(false)
  const [passForm,  setPassForm]  = useState({ current: '', next: '', confirm: '' })
  const [passErr,   setPassErr]   = useState({})
  const [passBusy,  setPassBusy]  = useState(false)
  const [passShake, setPassShake] = useState(false)

  // Fetch Firestore role
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    nameRef.current?.focus()
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { if (snap.exists()) setPapel(snap.data()?.papel ?? null) })
      .catch(() => {})
  }, [user, navigate])

  const triggerShake = setter => {
    setter(true)
    setTimeout(() => setter(false), 500)
  }

  // ── Update username ─────────────────────────────────────────────────────────
  const handleNameSubmit = async e => {
    e.preventDefault()
    const errs = validateName(nameForm)
    if (Object.keys(errs).length) { setNameErr(errs); triggerShake(setNameShake); return }
    setNameBusy(true)
    try {
      await updateProfile(user, { displayName: nameForm.username.trim() })
      onNotify?.({ message: 'Matagumpay na napalitan ang iyong Username!', type: 'success' })
    } catch {
      setNameErr({ username: 'Hindi ma-update. Subukang muli.' })
      triggerShake(setNameShake)
      onNotify?.({ message: 'Hindi ma-update ang username.', type: 'error' })
    } finally {
      setNameBusy(false)
    }
  }

  // ── Update password ─────────────────────────────────────────────────────────
  const handlePassSubmit = async e => {
    e.preventDefault()
    const errs = validatePass(passForm)
    if (Object.keys(errs).length) { setPassErr(errs); triggerShake(setPassShake); return }
    setPassBusy(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, passForm.current)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, passForm.next)
      setPassForm({ current: '', next: '', confirm: '' })
      onNotify?.({ message: 'Password na-update nang matagumpay!', type: 'success' })
    } catch (err) {
      const isBadPass = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
      setPassErr(isBadPass
        ? { current: 'Mali ang kasalukuyang password.' }
        : { confirm: 'May error. Subukan muli.' }
      )
      triggerShake(setPassShake)
      onNotify?.({ message: 'Hindi ma-update ang password.', type: 'error' })
    } finally {
      setPassBusy(false)
    }
  }

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="prof-root">

      {/* Background */}
      <div className="prof-bg" aria-hidden="true">
        <div className="prof-bg-grid" />
        <div className="prof-bg-vignette" />
        <div className="prof-bg-glow" />
      </div>

      <div className="prof-container">

        {/* Top bar */}
        <div className="prof-topbar">
          <span className="prof-topbar-path">
            Dashboard <span style={{ opacity: 0.4 }}>›</span>
            <span>Account</span>
          </span>
        </div>

        {/* Hero */}
        <div className="prof-hero">
          <Avatar name={user.displayName || user.email} />

          <div className="prof-hero-info">
            <p className="prof-hero-label">Inyong Profile</p>
            <div className="prof-hero-name-row">
              <h1 className="prof-hero-name">{user.displayName || 'Mambabasa'}</h1>
              <PapelBadge papel={papel} />
            </div>
            <p className="prof-hero-email">{user.email}</p>
            <div className="prof-hero-meta">
              <span className="prof-hero-stat">
                Papel <strong>{papel ? PAPEL_CONFIG[papel]?.label ?? papel : '—'}</strong>
              </span>
              <span className="prof-hero-divider" />
              <span className="prof-hero-stat">
                Status <strong>Aktibo</strong>
              </span>
            </div>
          </div>

          <button className="prof-signout-btn" onClick={handleSignOut} aria-label="Mag-sign out">
            <SignOutIcon />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Stats row — driven by QuizSection's data via lifted state if desired,
            or kept as static placeholders until you need the top-level stats too */}
        <div className="prof-stats-row">
          {[
            { label: 'Mga Pagsusulit',  value: '—', note: 'na sinagutan' },
            { label: 'Kabuuang Marka',  value: '—', note: 'na average',   gold: true },
            { label: 'Pinakamataas',    value: '—', note: 'na score' },
            { label: 'Mga Araw Aktibo', value: '—', note: 'na araw' },
          ].map((s, i) => (
            <div className="prof-stat-card" key={i}>
              <div className="prof-stat-label">{s.label}</div>
              <div className={`prof-stat-value${s.gold ? ' prof-stat-value--gold' : ''}`}>{s.value}</div>
              <div className="prof-stat-sub">{s.note}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="prof-main-grid">

          {/* ── Username ── */}
          <div className="prof-section" style={{ animationDelay: '0ms' }}>
            <div className="prof-section-header">
              <div className="prof-section-header-left">
                <span className="prof-section-icon"><UserIcon /></span>
                <h2 className="prof-section-title">Baguhin ang Username</h2>
              </div>
            </div>
            <form
              className={`prof-form${nameShake ? ' prof-form--shake' : ''}`}
              onSubmit={handleNameSubmit}
              noValidate
            >
              <Field label="Bagong Username" error={nameErr.username}>
                <div className="prof-input-wrap">
                  <span className="prof-input-icon"><UserIcon /></span>
                  <input
                    ref={nameRef}
                    id="prof-username"
                    type="text"
                    className="prof-input"
                    placeholder={user.displayName || 'Ilagay ang username'}
                    value={nameForm.username}
                    onChange={e => { setNameForm({ username: e.target.value }); setNameErr({}) }}
                    autoComplete="username"
                    maxLength={30}
                  />
                </div>
              </Field>
              <div className="prof-char-count">{nameForm.username.length} / 30</div>
              <button type="submit" className="prof-btn" disabled={nameBusy} aria-busy={nameBusy}>
                {nameBusy && <span className="prof-spinner" aria-hidden="true" />}
                {nameBusy ? 'Sine-save…' : 'I-save ang Username'}
              </button>
            </form>
          </div>

          {/* ── Password ── */}
          <div className="prof-section prof-section--password" style={{ animationDelay: '80ms' }}>
            <div className="prof-section-header">
              <div className="prof-section-header-left">
                <span className="prof-section-icon prof-section-icon--red"><LockIcon /></span>
                <h2 className="prof-section-title">Baguhin ang Password</h2>
              </div>
            </div>
            <form
              className={`prof-form${passShake ? ' prof-form--shake' : ''}`}
              onSubmit={handlePassSubmit}
              noValidate
            >
              <Field label="Kasalukuyang Password" error={passErr.current}>
                <PassInput
                  id="prof-current"
                  value={passForm.current}
                  onChange={e => { setPassForm(p => ({ ...p, current: e.target.value })); setPassErr({}) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Field label="Bagong Password" error={passErr.next}>
                <PassInput
                  id="prof-next"
                  value={passForm.next}
                  onChange={e => { setPassForm(p => ({ ...p, next: e.target.value })); setPassErr({}) }}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Kumpirmahin ang Bagong Password" error={passErr.confirm}>
                <PassInput
                  id="prof-confirm"
                  value={passForm.confirm}
                  onChange={e => { setPassForm(p => ({ ...p, confirm: e.target.value })); setPassErr({}) }}
                  placeholder="Ulitin ang bagong password"
                  autoComplete="new-password"
                />
              </Field>
              <button type="submit" className="prof-btn prof-btn--red" disabled={passBusy} aria-busy={passBusy}>
                {passBusy && <span className="prof-spinner" aria-hidden="true" />}
                {passBusy ? 'Sine-save…' : 'I-save ang Password'}
              </button>
            </form>
          </div>

          {/* ── Quiz Summary — passes Firebase UID to fetch this user's data ── */}
          <QuizSection userId={user.uid} />

        </div>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}