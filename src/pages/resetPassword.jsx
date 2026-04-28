import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../API/firebase'
import { useUI } from '../context/UIContext'
import MascotBubble from '../components/MascotBubble'
import './auth.css'

export default function ResetPassword() {
  const { notify } = useUI()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const oobCode = searchParams.get('oobCode')

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [verifying, setVerifying]     = useState(true)
  const [invalidCode, setInvalidCode] = useState(false)
  const [shake, setShake]             = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // Verify the oobCode is valid on mount
  useEffect(() => {
    if (!oobCode) {
      setInvalidCode(true)
      setVerifying(false)
      return
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(emailFromCode => {
        setEmail(emailFromCode)
        setVerifying(false)
      })
      .catch(() => {
        setInvalidCode(true)
        setVerifying(false)
      })
  }, [oobCode])

  const validate = () => {
    const e = {}
    if (!password)              e.password = 'Kailangan ang bagong password.'
    else if (password.length < 8) e.password = 'Hindi bababa sa 8 karakter.'
    if (!confirmPassword)       e.confirmPassword = 'Kumpirmahin ang password.'
    else if (password !== confirmPassword) e.confirmPassword = 'Hindi magkatugma.'
    return e
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); triggerShake(); return }

    setLoading(true)
    try {
      await confirmPasswordReset(auth, oobCode, password)
      notify('Matagumpay na na-reset ang iyong password! Mag-login na.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err.code === 'auth/expired-action-code') {
        setErrors({ general: 'Expired na ang reset link. Humiling ng bago.' })
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'Masyadong mahina ang password.' })
      } else {
        setErrors({ general: 'May error na naganap. Subukan muli.' })
      }
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = password
    if (!p) return 0
    let s = 0
    if (p.length >= 8)          s++
    if (/[A-Z]/.test(p))        s++
    if (/[0-9]/.test(p))        s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Mahina', 'Katamtaman', 'Malakas', 'Napakalakas'][strength]
  const strengthClass = ['', 'auth-strength--1', 'auth-strength--2', 'auth-strength--3', 'auth-strength--4'][strength]

  return (
    <div className="auth-root">
      <div className={`auth-card${shake ? ' auth-card--shake' : ''}`}>

        <div className="auth-brand">
          <div className="auth-hero-image">
            <MascotBubble mode="reset" />
          </div>
        </div>

        <div className="auth-right">

          {verifying ? (
            <div className="auth-header-center">
              <p className="auth-greeting">Bine-verify ang iyong reset link…</p>
            </div>
          ) : invalidCode ? (
            <div className="auth-header-center">
              <h1 className="auth-heading">Invalid o Expired na Link</h1>
              <p className="auth-greeting">
                Ang reset link na ito ay hindi na valid o expired na. Humiling ng bagong link.
              </p>
              <Link to="/forgot-password" className="auth-submit" style={{ display: 'inline-block', marginTop: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                Humiling ng Bagong Link
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-header-center">
                <h1 className="auth-heading">I-reset ang Password</h1>
                <p className="auth-greeting">
                  Gumawa ng bagong password para sa <strong>{email}</strong>.
                </p>
              </div>

              {errors.general && (
                <span className="auth-error-msg" role="alert" style={{ display: 'block', marginBottom: '1rem' }}>
                  {errors.general}
                </span>
              )}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>

                {/* New Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="rp-password">Bagong Password</label>
                  <div className="auth-input-wrap">
                    <LockIcon />
                    <input
                      id="rp-password"
                      type={showPass ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Min. 8 karakter"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                    />
                    <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                  </div>
                  {password && (
                    <div className={`auth-strength-wrap ${strengthClass}`}>
                      <div className="auth-strength-bar">
                        {[1,2,3,4].map(n => (
                          <div key={n} className={`auth-strength-seg${strength >= n ? ` ${strengthClass}` : ''}`} />
                        ))}
                      </div>
                      <span className="auth-strength-label">{strengthLabel}</span>
                    </div>
                  )}
                  {errors.password && <span className="auth-error-msg" role="alert">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="rp-confirm">Kumpirmahin ang Password</label>
                  <div className="auth-input-wrap">
                    <LockIcon />
                    <input
                      id="rp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Ulitin ang password"
                      value={confirmPassword}
                      onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })) }}
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                  </div>
                  {errors.confirmPassword && <span className="auth-error-msg" role="alert">{errors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                  aria-busy={loading}
                  style={{ marginTop: '1.5rem' }}
                >
                  {loading && <span className="auth-spinner" aria-hidden="true" />}
                  {loading ? 'Sine-save…' : 'I-reset ang Password'}
                </button>
              </form>

              <p className="auth-switch">
                <Link className="auth-switch-link" to="/login">Bumalik sa Login</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" className="auth-toggle-pass" onClick={onToggle} aria-label={show ? 'Itago' : 'Ipakita'}>
      {show
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}