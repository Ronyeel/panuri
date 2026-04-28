import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../API/firebase'
import { useUI } from '../context/UIContext'
import MascotBubble from '../components/MascotBubble'
import './auth.css'

function validate({ email }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Kailangan ang email.'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Hindi wastong email.'
  return errors
}

export default function ForgotPassword() {
  const { notify } = useUI()
  const navigate = useNavigate()
  const emailRef = useRef(null)

  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const errs = validate({ email })
    if (Object.keys(errs).length) {
      setErrors(errs)
      triggerShake()
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      notify('Ipinadala na ang password reset link sa iyong email.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setErrors({ email: 'Walang nakitang account sa email na ito.' })
      } else {
        setErrors({ email: 'May error na naganap. Subukan muli.' })
      }
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className={`auth-card${shake ? ' auth-card--shake' : ''}`}>

        <div className="auth-brand">
          <div className="auth-hero-image">
            <MascotBubble mode="forgot" />
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-header-center">
            <h1 className="auth-heading">Nakalimutan ang Password?</h1>
            <p className="auth-greeting">
              Ilagay ang iyong email address upang makatanggap ng password reset link.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="fp-email">Email Address</label>
              <div className="auth-input-wrap">
                <MailIcon />
                <input
                  id="fp-email"
                  ref={emailRef}
                  type="email"
                  className="auth-input"
                  placeholder="ikaw@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors({}) }}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span className="auth-error-msg" role="alert">{errors.email}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              aria-busy={loading}
              style={{ marginTop: '1.5rem' }}
            >
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading ? 'Ipinapadala…' : 'Ipadala ang Link'}
            </button>
          </form>

          <p className="auth-switch">
            Naalala mo na ang iyong password?{' '}
            <Link className="auth-switch-link" to="/login">Bumalik sa Login</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8l10 6 10-6" />
    </svg>
  )
}