// NavBar.jsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import SearchBar from './searchBar'
import './NavBar.css'

export const navLinks = [
  { label: 'Home',                    to: '/' },
  { label: 'Mga Libro',               to: '/mga-libro' },
  { label: 'Pagsusuri',               to: '/pagsusuri' },
  { label: 'Teoryang Pampanitikan',   to: '/teorya' },
  { label: 'Bagong Pamantayan',       to: '/bagong-pamantayan' },
  { label: 'Tungkol Sa Amin',         to: '/tungkol-sa' },
]

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function MagsuriButton({ onClick }) {
  return (
    <div className="magsuri-wrapper">
      <button className="magsuri-btn" onClick={onClick} aria-label="Magsuri Tayo">
        <img src="/examine.svg" alt="Magsuri Tayo" className="magsuri-icon" />
      </button>
      <div className="magsuri-tooltip">
        <span className="magsuri-tooltip-title">Magsuri Tayo</span>
      </div>
    </div>
  )
}

export default function NavBar({ isLoggedIn = false, username = '' }) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setMenuOpen(false)

  const handleProfileClick = () => {
    if (isLoggedIn) { navigate('/profile'); close() }
    else setNotifOpen(true)
  }

  const displayName = username
    ? (username.length > 14 ? username.slice(0, 13) + '…' : username)
    : 'Sign In'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Logo */}
          <a href="/" className="navbar-logo"
            onClick={e => { e.preventDefault(); navigate('/'); close() }}>
            <span className="logo-line1">WEBSITE</span>
            <span className="logo-line2">LOGO</span>
          </a>

          {/* Search bar — desktop + mobile toggle + mobile panel */}
          <SearchBar
            mobileOpen={searchOpen}
            onMobileToggle={() => setSearchOpen(v => !v)}
          />

          {/* Actions */}
          <div className="navbar-actions">
            {/* (mobile search toggle button is rendered inside SearchBar) */}

            <div className="navbar-divider" />

            <MagsuriButton onClick={() => navigate('/magsuri')} />

            <button
              className={`navbar-profile${isLoggedIn ? ' navbar-profile--loggedin' : ''}`}
              aria-label={isLoggedIn ? `Pumunta sa Profile ni ${username}` : 'Mag-Sign In'}
              onClick={handleProfileClick}
            >
              <span className="navbar-profile-icon"><UserIcon /></span>
              <span className="navbar-profile-label">{displayName}</span>
            </button>

            {/* Hamburger — mobile only */}
            <button
              className={`navbar-burger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <div className={`navbar-mobile ${menuOpen ? 'navbar-mobile--open' : ''}`}>
          {navLinks.map(link => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `navbar-mobile-link${isActive ? ' navbar-link--active' : ''}`
              }
              onClick={close}
            >
              {link.label}
            </NavLink>
          ))}

          <NavLink
            to="/magsuri"
            className={({ isActive }) =>
              `navbar-mobile-link${isActive ? ' navbar-link--active' : ''}`
            }
            onClick={close}
          >
            Magsuri Tayo
          </NavLink>

          {isLoggedIn ? (
            <NavLink
              to="/profile"
              className="navbar-mobile-link navbar-mobile-profile"
              onClick={close}
            >
              <UserIcon /> {username || 'Profile'}
            </NavLink>
          ) : (
            <button
              className="navbar-mobile-link navbar-mobile-profile navbar-mobile-signin"
              onClick={() => { close(); setNotifOpen(true) }}
            >
              <UserIcon /> Mag-Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  )
}