import { Link } from 'react-router-dom'
import './Footer.css'

const NAV_LINKS = [
  { label: 'Home',              to: '/' },
  { label: 'Mga Aklat',         to: '/mga-libro' },
  { label: 'Pagsusuri',         to: '/pagsusuri' },
  { label: 'Teorya',            to: '/teorya' },
  { label: 'Bagong Pamantayan', to: '/bagong-pamantayan' },
  { label: 'Tungkol Sa Amin',   to: '/tungkol-sa' },
]

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/notyourtrapsssy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Gmail',
    href: 'mailto:zyriel.alvarez@gmail.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
      </svg>
    ),
  }
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Top row */}
        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <span className="footer-logo-mark"></span>
            <div>
              <p className="footer-site-name">PANURI</p>
              <p className="footer-tagline">Camarines Norte State College</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="footer-nav" aria-label="Footer navigation">
            <p className="footer-col-label">Nabigasyon</p>
            <ul className="footer-nav-list">
              {NAV_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="footer-nav-link">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Socials */}
          <div className="footer-socials-col">
            <p className="footer-col-label">Sundan Kami</p>
            <div className="footer-socials">
              {SOCIALS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  className="footer-social-btn"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="footer-rule" aria-hidden="true">
          <span /><span className="footer-diamond"></span><span />
        </div>

        {/* Bottom row */}
        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {year} PANURI — Lahat ng karapatan ay nakalaan.
          </p>
        </div>

      </div>
    </footer>
  )
}