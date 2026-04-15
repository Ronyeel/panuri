// adminExcerpts.jsx
import { useEffect, useState, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../API/firebase'

const EMPTY_FORM = {
  title: '', source: '', author: '',
  content: '', tags: '', featured: false,
}

export default function AdminExcerpts() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [modal,   setModal]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'excerpts'), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setError('')
    setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const openEdit = (item) => {
    setForm({
      title:    item.title    ?? '',
      source:   item.source   ?? '',
      author:   item.author   ?? '',
      content:  item.content  ?? '',
      tags:     Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags ?? ''),
      featured: item.featured ?? false,
    })
    setEditing(item.id)
    setError('')
    setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const closeModal = () => { setModal(false); setEditing(null); setError('') }

  const validate = () => {
    if (!form.title.trim())   return 'Kailangan ang pamagat.'
    if (!form.content.trim()) return 'Kailangan ang nilalaman ng sipi.'
    return ''
  }

  // Parse comma-separated tags safely
  const parseTags = (raw) =>
    raw.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10)

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setSaving(true)
    setError('')

    const payload = {
      title:     form.title.trim(),
      source:    form.source.trim(),
      author:    form.author.trim(),
      content:   form.content.trim(),
      tags:      parseTags(form.tags),
      featured:  form.featured,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid ?? 'unknown',
    }

    try {
      if (editing) {
        await updateDoc(doc(db, 'excerpts', editing), payload)
      } else {
        await addDoc(collection(db, 'excerpts'), {
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

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Tanggalin ang siping ito?\n\n"${title}"`)) return
    try {
      await deleteDoc(doc(db, 'excerpts', id))
    } catch (e) {
      console.error(e)
      alert('Hindi matanggal. Subukan ulit.')
    }
  }

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase())  ||
    i.author?.toLowerCase().includes(search.toLowerCase()) ||
    i.source?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="ep-page">
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Mga Sipi</p>
          <h1 className="ep-page-title">Excerpts</h1>
        </div>
        <button className="ep-btn ep-btn--primary" onClick={openAdd}>+ Magdagdag</button>
      </div>

      {/* Stats */}
      <div className="ep-stats-grid">
        {[
          { label: 'Kabuuan',  val: items.length,                        icon: '📄', accent: '#3B82F6' },
          { label: 'Featured', val: items.filter(i => i.featured).length, icon: '⭐', accent: '#F59E0B' },
          { label: 'Regular',  val: items.filter(i => !i.featured).length,icon: '📝', accent: '#10B981' },
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
          <h2 className="ep-card-title">Lahat ng Sipi</h2>
          <div className="ep-search-wrap">
            <svg className="ep-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="ep-search" placeholder="Hanapin ang sipi..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th>Pinagkunan</th>
                  <th>May-akda</th>
                  <th>Featured</th>
                  <th>Mga Tag</th>
                  <th>Aksyon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="ep-empty">Walang nahanap na sipi.</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="ep-table-row">
                    <td style={{ fontWeight: 500, color: '#e0e0e0' }}>{item.title}</td>
                    <td style={{ color: '#aaa' }}>{item.source || '—'}</td>
                    <td style={{ color: '#aaa' }}>{item.author || '—'}</td>
                    <td>
                      {item.featured
                        ? <span className="ep-pill ep-pill--admin">⭐ Featured</span>
                        : <span style={{ color: '#555', fontSize: 13 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(item.tags ?? []).slice(0, 3).map(tag => (
                          <span key={tag} style={{
                            padding: '1px 7px', borderRadius: 99, fontSize: 11,
                            background: '#1e1e2e', color: '#818cf8',
                            border: '1px solid #2e2e4e',
                          }}>{tag}</span>
                        ))}
                        {(item.tags?.length ?? 0) > 3 && (
                          <span style={{ color: '#555', fontSize: 11 }}>+{item.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="ep-actions">
                        <button className="ep-btn ep-btn--ghost"  onClick={() => openEdit(item)}>Edit</button>
                        <button className="ep-btn ep-btn--danger" onClick={() => handleDelete(item.id, item.title)}>Delete</button>
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
              <h2>{editing ? 'I-edit ang Sipi' : 'Bagong Sipi'}</h2>
              <button className="ep-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="ep-modal-body">
              {error && <p className="ep-form-error">{error}</p>}

              <div className="ep-form-grid">
                <div className="ep-form-group ep-form-group--full">
                  <label>Pamagat *</label>
                  <input ref={titleRef} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="ep-input" placeholder="Pamagat ng sipi" />
                </div>
                <div className="ep-form-group">
                  <label>Pinagkunan</label>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="ep-input" placeholder="hal. Florante at Laura" />
                </div>
                <div className="ep-form-group">
                  <label>May-akda</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="ep-input" placeholder="Pangalan ng may-akda" />
                </div>
                <div className="ep-form-group ep-form-group--full">
                  <label>Nilalaman *</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="ep-input ep-textarea" placeholder="I-paste ang sipi dito..." rows={6} />
                </div>
                <div className="ep-form-group">
                  <label>Mga Tag <span style={{ color: '#555', fontWeight: 400 }}>(hatiin ng kuwit)</span></label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="ep-input" placeholder="hal. epiko, pag-ibig, kalayaan" />
                </div>
                <div className="ep-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span>I-feature ang siping ito</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="ep-modal-footer">
              <button className="ep-btn ep-btn--ghost"   onClick={closeModal} disabled={saving}>Kanselahin</button>
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