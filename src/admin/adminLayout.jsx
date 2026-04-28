// AdminLayout.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../API/firebase'
import { supabase } from '../API/supabase'
import { MdDashboard, MdMenuBook, MdQuiz, MdGrading, MdArticle, MdChevronLeft, MdChevronRight, MdLogout } from 'react-icons/md'
import './admin.css'

const NAV_ITEMS = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: <MdDashboard size={20} />,
  },
  {
    path: '/admin/books',
    label: 'Mga Aklat',
    icon: <MdMenuBook size={20} />,
  },
  {
    path: '/admin/quiz',
    label: 'Pagsusulit',
    icon: <MdQuiz size={20} />,
  },
  {
    path: '/admin/quiz/grading',
    label: 'Pagmamarka',
    icon: <MdGrading size={20} />,
  },
  {
    path: '/admin/excerpts',
    label: 'Excerpts',
    icon: <MdArticle size={20} />,
  },
]

// Paths that should only match exactly (not via startsWith)
const EXACT_MATCH_PATHS = new Set(['/admin', '/admin/quiz'])

export default function AdminLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Realtime refs
  const mountedRef = useRef(true)
  const channelRef = useRef(null)
  const retryTimerRef = useRef(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(retryTimerRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchPending = async () => {
    const { count } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review')
    if (count !== null) setPendingCount(count)
  }

  const subscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`pending_grading_layout_${Date.now()}_${Math.random()}`, {
      config: { presence: { key: 'admin-layout' } }
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, fetchPending)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchPending()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          fetchPending()
          clearTimeout(retryTimerRef.current)
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) subscribe()
          }, 3000)
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    fetchPending()
    subscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className={`ep-shell ${collapsed ? 'ep-shell--collapsed' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className="ep-sidebar">

        <div className="ep-sidebar-header">
          <div className="ep-logo">
            <img src="/mascot.png" alt="Panuri Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
            <span className="ep-logo-text">Panisuri</span>
          </div>
          <button
            className="ep-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <MdChevronRight size={22} /> : <MdChevronLeft size={22} />}
          </button>
        </div>

        <nav className="ep-nav">
          {NAV_ITEMS.map(item => {
            const active = EXACT_MATCH_PATHS.has(item.path)
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`ep-nav-item ${active ? 'ep-nav-item--active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="ep-nav-icon" style={{ position: 'relative' }}>
                  {item.icon}
                  {item.path === '/admin/quiz/grading' && pendingCount > 0 && collapsed && (
                    <span className="ep-nav-dot" />
                  )}
                </span>
                <span className="ep-nav-label" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  {item.label}
                  {item.path === '/admin/quiz/grading' && pendingCount > 0 && !collapsed && (
                    <span className="ep-nav-badge">{pendingCount}</span>
                  )}
                </span>
                {active && <span className="ep-nav-indicator" />}
              </Link>
            )
          })}
        </nav>

        <div className="ep-sidebar-footer">
          <button className="ep-logout-btn" onClick={handleLogout} title={collapsed ? 'Mag-logout' : undefined}>
            <MdLogout size={20} />
            <span>Mag-logout</span>
          </button>
        </div>

      </aside>

      {/* ── Main ── */}
      <main className="ep-main">
        <div className="ep-main-glow" aria-hidden="true" />
        <Outlet />
      </main>

    </div>
  )
}