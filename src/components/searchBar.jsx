// SearchBar.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../API/useSearch'
import './searchBar.css'

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="search-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

/**
 * ResultItem — a single dropdown row
 */
function ResultItem({ item, isActive, onMouseEnter, onClick }) {
  return (
    <li
      className={`search-result-item${isActive ? ' search-result-item--active' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseDown={onClick}
      role="option"
      aria-selected={isActive}
    >
      <span className="search-result-title">{item.title}</span>

      {item.subtitle && (
        <span style={{ fontSize: '0.7rem', color: '#888' }}>
          {item.subtitle}
        </span>
      )}

      <span className="search-result-category">{item.category}</span>
    </li>
  )
}

/**
 * SearchDropdown — the results list
 */
function SearchDropdown({ results, loading, error, query, activeIndex, onMouseEnter, onSelect }) {
  if (!query.trim()) return null

  return (
    <ul className="search-dropdown" role="listbox" aria-label="Mga resulta ng paghahanap">
      {loading && (
        <li className="search-dropdown-state">
          <SpinnerIcon /> Naghahanap…
        </li>
      )}

      {!loading && error && (
        <li className="search-dropdown-state search-dropdown-state--error">
          {error}
        </li>
      )}

      {!loading && !error && results.length === 0 && (
        <li className="search-dropdown-state">
          Walang nahanap para sa "<strong>{query}</strong>"
        </li>
      )}

      {!loading && !error && results.map((item, i) => (
        <ResultItem
          key={item.id}
          item={item}
          isActive={i === activeIndex}
          onMouseEnter={() => onMouseEnter(i)}
          onClick={() => onSelect(item)}
        />
      ))}
    </ul>
  )
}

/**
 * useSearchBar — encapsulates query state, keyboard nav, and submit logic
 */
function useSearchBar(onClose) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const navigate = useNavigate()
  const { results, loading, error } = useSearch(query)

  const showDropdown = focused && query.trim().length > 0

  const navigateTo = (path) => {
    navigate(path)
    setQuery('')
    setFocused(false)
    setActiveIndex(-1)
    onClose?.()
  }

  const handleSelect = (item) => navigateTo(item.path)

  const handleSubmit = (e) => {
    e?.preventDefault()

    if (activeIndex >= 0 && results[activeIndex]) {
      navigateTo(results[activeIndex].path)
    } else if (query.trim()) {
      navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
    }
  }

  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  return {
    query, setQuery,
    focused, setFocused,
    activeIndex, setActiveIndex,
    results, loading, error,
    showDropdown,
    handleSelect,
    handleSubmit,
    handleKeyDown,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SearchBar({ mobileOpen: mobileOpenProp, onMobileToggle }) {
  const isControlled = mobileOpenProp !== undefined
  const [internalOpen, setInternalOpen] = useState(false)

  const mobileOpen = isControlled ? mobileOpenProp : internalOpen
  const toggleMobile = onMobileToggle ?? (() => setInternalOpen(v => !v))

  const mobileInputRef = useRef(null)

  const desktop = useSearchBar()
  const mobile = useSearchBar(() => {
    if (!isControlled) setInternalOpen(false)
    else onMobileToggle?.()
  })

  useEffect(() => {
    if (mobileOpen && mobileInputRef.current) {
      mobileInputRef.current.focus()
    }
  }, [mobileOpen])

  const handleMobileClose = () => {
    mobile.setQuery('')
    mobile.setFocused(false)

    if (!isControlled) setInternalOpen(false)
    else onMobileToggle?.()
  }

  return (
    <>
      {/* Desktop */}
      <div className="navbar-search-wrapper">
        <form className="navbar-search" onSubmit={desktop.handleSubmit} autoComplete="off">
          <span className="navbar-search-icon">
            {desktop.loading ? <SpinnerIcon /> : <SearchIcon />}
          </span>

          <input
            type="search"
            className="navbar-search-input"
            placeholder="Maghanap…"
            value={desktop.query}
            onChange={e => desktop.setQuery(e.target.value)}
            onFocus={() => desktop.setFocused(true)}
            onBlur={() => setTimeout(() => desktop.setFocused(false), 150)}
            onKeyDown={desktop.handleKeyDown}
          />
        </form>

        {desktop.showDropdown && (
          <SearchDropdown
            results={desktop.results}
            loading={desktop.loading}
            error={desktop.error}
            query={desktop.query}
            activeIndex={desktop.activeIndex}
            onMouseEnter={desktop.setActiveIndex}
            onSelect={desktop.handleSelect}
          />
        )}
      </div>

      {/* Mobile button */}
      <button
        className="navbar-search-btn"
        aria-expanded={mobileOpen}
        onClick={toggleMobile}
      >
        <SearchIcon />
      </button>

      {/* Mobile panel */}
      <div className={`navbar-search-mobile ${mobileOpen ? 'navbar-search-mobile--open' : ''}`}>
        <div className="navbar-search-mobile-inner">
          <form onSubmit={mobile.handleSubmit} autoComplete="off" style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
            <span className="navbar-search-icon">
              {mobile.loading ? <SpinnerIcon /> : <SearchIcon />}
            </span>

            <input
              ref={mobileInputRef}
              type="search"
              className="navbar-search-input-mobile"
              placeholder="Maghanap…"
              value={mobile.query}
              onChange={e => mobile.setQuery(e.target.value)}
              onFocus={() => mobile.setFocused(true)}
              onBlur={() => setTimeout(() => mobile.setFocused(false), 150)}
              onKeyDown={mobile.handleKeyDown}
            />

            <button type="button" onClick={handleMobileClose}>
              ✕
            </button>
          </form>

          {mobile.showDropdown && (
            <SearchDropdown
              results={mobile.results}
              loading={mobile.loading}
              error={mobile.error}
              query={mobile.query}
              activeIndex={mobile.activeIndex}
              onMouseEnter={mobile.setActiveIndex}
              onSelect={mobile.handleSelect}
            />
          )}
        </div>
      </div>
    </>
  )
}