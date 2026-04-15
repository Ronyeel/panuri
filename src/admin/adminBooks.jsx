// adminBooks.jsx
import { useEffect, useState, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../API/firebase'

/* ── helpers ── */
function slugify(str = '') {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)
}

const EMPTY_FORM = {
  title: '', author: '', genre: '', description: '',
  coverUrl: '', publishedYear: '', available: true,
}

/* ── component ── */
export default function AdminBooks() {
  const [books,   setBooks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)   // book id being edited
  const [modal,   setModal]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const titleRef = useRef(null)

  /* real-time listener */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'books'), snap => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  /* open modal */
  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setError('')
    setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const openEdit = (book) => {
    setForm({
      title: book.title ?? '',
      author: book.author ?? '',
      genre: book.genre ?? '',
      description: book.description ?? '',
      coverUrl: book.coverUrl ?? '',
      publishedYear: book.publishedYear ?? '',
      available: book.available ?? true,
    })
    setEditing(book.id)
    setError('')
    setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const closeModal = () => { setModal(false); setEditing(null); setError('') }

  /* validate */
  const validate = () => {
    if (!form.title.trim())  return 'Kailangan ang pamagat.'
    if (!form.author.trim()) return 'Kailangan ang pangalan ng may-akda.'
    if (form.publishedYear && !/^\d{4}$/.test(form.publishedYear.trim()))
      return 'Ang taon ay dapat 4 na digit (hal. 2024).'
    if (form.coverUrl.trim() && !/^https?:\/\/.+/.test(form.coverUrl.trim()))
      return 'Ang cover URL ay dapat magsimula sa http:// o https://.'
    return ''
  }

  /* save */
  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setSaving(true)
    setError('')

    const payload = {
      title:         form.title.trim(),
      author:        form.author.trim(),
      genre:         form.genre.trim(),
      description:   form.description.trim(),
      coverUrl:      form.coverUrl.trim(),
      publishedYear: form.publishedYear.trim(),
      available:     form.available,
      slug:          slugify(form.title),
      updatedAt:     serverTimestamp(),
      updatedBy:     auth.currentUser?.uid ?? 'unknown',
    }

    try {
      if (editing) {
        await updateDoc(doc(db, 'books', editing), payload)
      } else {
        await addDoc(collection(db, 'books'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid ?? 'unknown',
        })
      }
      closeModal()
    } catch (e) {
      console.error(e)
      setError('Hindi ma-save. Subukan ulit.')
    } finally {
      setSaving(false)
    }
  }

  /* delete */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Tanggalin ang "${title}"?`)) return
    try {
      await deleteDoc(doc(db, 'books', id))
    } catch (e) {
      console.error(e)
      alert('Hindi matanggal. Subukan ulit.')
    }
  }

  /* filter */
  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.genre?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── render ── */
  return (
    <div className="ep-page">
      {/* Header */}
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Koleksyon</p>
          <h1 className="ep-page-title">Books</h1>
        </div>
        <button className="ep-btn ep-btn--primary" onClick={openAdd}>+ Magdagdag</button>
      </div>

      {/* Stats */}
      <div className="ep-stats-grid">
        {[
          { label: 'Kabuuan',    val: books.length,                              icon: '📚', accent: '#3B82F6' },
          { label: 'Available',  val: books.filter(b => b.available).length,     icon: '✅', accent: '#10B981' },
          { label: 'Unavailable',val: books.filter(b => !b.available).length,    icon: '🚫', accent: '#EF4444' },
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

      {/* Table */}
      <div className="ep-card">
        <div className="ep-card-header">
          <h2 className="ep-card-title">Lahat ng Libro</h2>
          <div className="ep-search-wrap">
            <svg className="ep-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="ep-search"
              placeholder="Hanapin ang libro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="ep-loading"><div className="ep-spinner" /><span>Naglo-load…</span></div>
        ) : (
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Pamagat</th>
                  <th>May-akda</th>
                  <th>Genre</th>
                  <th>Taon</th>
                  <th>Status</th>
                  <th>Aksyon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="ep-empty">Walang nahanap na libro.</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="ep-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {b.coverUrl
                          ? <img src={b.coverUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #2a2a2a' }} />
                          : <div style={{ width: 32, height: 44, background: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📖</div>
                        }
                        <span style={{ fontWeight: 500, color: '#e0e0e0' }}>{b.title}</span>
                      </div>
                    </td>
                    <td style={{ color: '#aaa' }}>{b.author || '—'}</td>
                    <td style={{ color: '#aaa' }}>{b.genre  || '—'}</td>
                    <td style={{ color: '#aaa' }}>{b.publishedYear || '—'}</td>
                    <td>
                      <span className={`ep-pill ep-pill--${b.available ? 'admin' : 'user'}`}>
                        {b.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="ep-actions">
                        <button className="ep-btn ep-btn--ghost" onClick={() => openEdit(b)}>Edit</button>
                        <button className="ep-btn ep-btn--danger" onClick={() => handleDelete(b.id, b.title)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="ep-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="ep-modal">
            <div className="ep-modal-header">
              <h2>{editing ? 'I-edit ang Libro' : 'Bagong Libro'}</h2>
              <button className="ep-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="ep-modal-body">
              {error && <p className="ep-form-error">{error}</p>}

              <div className="ep-form-grid">
                <div className="ep-form-group ep-form-group--full">
                  <label>Pamagat *</label>
                  <input ref={titleRef} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="ep-input" placeholder="Pamagat ng libro" />
                </div>
                <div className="ep-form-group">
                  <label>May-akda *</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="ep-input" placeholder="Pangalan ng may-akda" />
                </div>
                <div className="ep-form-group">
                  <label>Genre</label>
                  <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="ep-input" placeholder="hal. Nobela, Maikling Kwento" />
                </div>
                <div className="ep-form-group">
                  <label>Taon ng Paglalathala</label>
                  <input value={form.publishedYear} onChange={e => setForm(f => ({ ...f, publishedYear: e.target.value }))} className="ep-input" placeholder="hal. 2024" maxLength={4} />
                </div>
                <div className="ep-form-group">
                  <label>Status</label>
                  <select value={form.available ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, available: e.target.value === 'true' }))} className="ep-input">
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
                <div className="ep-form-group ep-form-group--full">
                  <label>Cover URL</label>
                  <input value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} className="ep-input" placeholder="https://..." />
                </div>
                <div className="ep-form-group ep-form-group--full">
                  <label>Paglalarawan</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="ep-input ep-textarea" placeholder="Maikling buod ng libro..." rows={4} />
                </div>
              </div>
            </div>

            <div className="ep-modal-footer">
              <button className="ep-btn ep-btn--ghost" onClick={closeModal} disabled={saving}>Kanselahin</button>
              <button className="ep-btn ep-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Sine-save…' : editing ? 'I-update' : 'Idagdag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}