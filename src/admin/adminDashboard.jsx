// AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../API/firebase'

function maskEmail(email = '') {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 3)}***@${domain}`
}

export default function AdminDashboard() {
  const [users,   setUsers]   = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const toggleRole = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { role: current === 'admin' ? 'user' : 'admin' })
  }

  const deleteUser = async (uid) => {
    if (!window.confirm('Tanggalin ang user na ito?')) return
    await deleteDoc(doc(db, 'users', uid))
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const admins  = users.filter(u => u.role === 'admin').length
  const regular = users.filter(u => u.role !== 'admin').length

  return (
    <div className="ep-page">
      {/* Page header */}
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Overview</p>
          <h1 className="ep-page-title">Dashboard</h1>
        </div>
        <div className="ep-live-badge">
          <span className="ep-live-dot" />
          Real-time
        </div>
      </div>

      {/* Stats */}
      <div className="ep-stats-grid">
        {[
          { label: 'Total Users',   val: users.length,  icon: '👥', accent: '#3B82F6' },
          { label: 'Admins',        val: admins,         icon: '🛡️', accent: '#8B5CF6' },
          { label: 'Regular Users', val: regular,        icon: '👤', accent: '#10B981' },
        ].map(s => (
          <div className="ep-stat-card" key={s.label} style={{ '--accent': s.accent }}>
            <div className="ep-stat-icon">{s.icon}</div>
            <div>
              <p className="ep-stat-label">{s.label}</p>
              <p className="ep-stat-val">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="ep-card">
        <div className="ep-card-header">
          <h2 className="ep-card-title">User Management</h2>
          <div className="ep-search-wrap">
            <svg className="ep-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="ep-search"
              type="text"
              placeholder="Hanapin ang user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="ep-loading">
            <div className="ep-spinner" />
            <span>Naglo-load…</span>
          </div>
        ) : (
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="ep-empty">Walang nahanap na user.</td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="ep-table-row">
                    <td className="ep-td-user">
                      <div className="ep-avatar">{(u.username?.[0] ?? '?').toUpperCase()}</div>
                      <span>{u.username}</span>
                    </td>
                    <td className="ep-td-email">{maskEmail(u.email)}</td>
                    <td>
                      <span className={`ep-pill ep-pill--${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="ep-actions">
                        <button
                          className="ep-btn ep-btn--ghost"
                          onClick={() => toggleRole(u.id, u.role)}
                          disabled={u.id === auth.currentUser?.uid}
                        >
                          {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        </button>
                        <button
                          className="ep-btn ep-btn--danger"
                          onClick={() => deleteUser(u.id)}
                          disabled={u.id === auth.currentUser?.uid}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}