// adminExcerpts.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../API/supabase'
import { MdAdd, MdSearch, MdArticle, MdPictureAsPdf, MdImage, MdMoreVert } from 'react-icons/md'
import { useUI } from '../context/UIContext'

const COVER_BUCKET = 'covers'
const PDF_BUCKET   = 'pdfs'

const SUPABASE_PDF_LIMIT_BYTES = 50 * 1024 * 1024 // 50 MB

async function uploadToStorage(bucket, file, pathPrefix = '') {
  const ext  = file.name.split('.').pop()
  const path = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}


const EMPTY_FORM = {
  bookTitle: '',
  author:    '',
  cover:     '',
  coverFile: null,
  tag:       '',
  year:      '',
  excerpt:   '',
  pdf:       '',
  pdfFile:   null,
}


export default function AdminExcerpts() {
  const { notify, confirm } = useUI()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [modal,   setModal]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error,   setError]   = useState('')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const titleRef = useRef(null)
  const coverInput = useRef(null)
  const pdfInput   = useRef(null)

  /* fetch */
  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('excerpts')
      .select('*')
      .order('id', { ascending: true })
    if (error) console.error(error)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const channel = supabase.channel('excerpts_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'excerpts' }, fetchItems)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  /* modal helpers */
  const openAdd = () => {
    setForm(EMPTY_FORM); setEditing(null); setError(''); setSaveMsg(''); setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const openEdit = (item) => {
    setForm({
      bookTitle: item.bookTitle ?? '',
      author:    item.author    ?? '',
      cover:     item.cover     ?? '',
      coverFile: null,
      tag:       item.tag       ?? '',
      year:      item.year      ?? '',
      excerpt:   item.excerpt   ?? '',
      pdf:       item.pdf       ?? '',
      pdfFile:   null,
    })
    setEditing(item.id); setError(''); setSaveMsg(''); setModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const closeModal = () => {
    setModal(false); setEditing(null); setError(''); setSaveMsg('')
    if (coverInput.current) coverInput.current.value = ''
    if (pdfInput.current)   pdfInput.current.value   = ''
  }

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(f => ({ ...f, coverFile: file, cover: '' }))
  }

  const handlePdfFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(f => ({ ...f, pdfFile: file, pdf: '' }))
  }

  const validate = () => {
    if (!form.bookTitle.trim()) return 'Kailangan ang pamagat ng libro.'
    if (form.year && !/^\d{4}$/.test(String(form.year).trim()))
      return 'Ang taon ay dapat 4 na digit (hal. 2024).'
    return ''
  }

  /* save */
  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(''); setSaveMsg('')

    try {
      let coverUrl = form.cover
      let pdfUrl   = form.pdf

      if (form.coverFile) {
        setSaveMsg('Ina-upload ang cover…')
        coverUrl = await uploadToStorage(COVER_BUCKET, form.coverFile, 'covers/')
      }

      if (form.pdfFile) {
        setSaveMsg('Ina-upload ang PDF…')
        pdfUrl = await uploadToStorage(PDF_BUCKET, form.pdfFile, 'pdfs/')
      }

      setSaveMsg('Sine-save…')

      const trim = (v) => (v && String(v).trim()) || '' // return empty string instead of null
      const payload = {
        bookTitle: form.bookTitle.trim(),
        author:    trim(form.author),
        cover:     coverUrl || '',
        tag:       trim(form.tag),
        year:      form.year ? parseInt(form.year, 10) : null,
        excerpt:   trim(form.excerpt),
        pdf:       pdfUrl || '',
      }

      if (editing) {
        const { error } = await supabase.from('excerpts').update(payload).eq('id', editing)
        if (error) throw error
        notify('Matagumpay na na-update ang sipi.', 'success')
      } else {
        const { error } = await supabase.from('excerpts').insert([payload])
        if (error) throw error
        notify('Matagumpay na naidagdag ang sipi.', 'success')
      }
      await fetchItems()
      closeModal()
    } catch (e) {
      console.error(e); setError('Hindi ma-save. Subukan ulit.')
    } finally {
      setSaving(false)
      setSaveMsg('')
    }
  }

  /* delete */
  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title:        `Tanggalin ang "${title}"?`,
      body:         'Permanente itong matatanggal. Hindi ito maibabalik.',
      confirmLabel: 'Tanggalin',
      danger:       true,
    })
    if (!ok) return
    const { error } = await supabase.from('excerpts').delete().eq('id', id)
    if (error) {
      notify('Hindi matanggal. Subukan ulit.', 'error')
    } else {
      setItems(prev => prev.filter(i => i.id !== id))
      notify(`"${title}" ay matagumpay na natanggal.`, 'success')
    }
  }

  const filtered = items.filter(i =>
    i.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    i.author?.toLowerCase().includes(search.toLowerCase())    ||
    i.tag?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="ep-page">

      {/* Header */}
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Mga Sipi</p>
          <h1 className="ep-page-title">Excerpts</h1>
        </div>
        <button className="ep-btn ep-btn--primary" onClick={openAdd}>
          <MdAdd size={16} />
          Magdagdag
        </button>
      </div>

      {/* Stats */}
      <div className="ep-stats-grid">
        {[
          { label: 'Kabuuan',   val: items.length,                         icon: <MdArticle />, accent: '#6c63ff' },
          { label: 'May PDF',   val: items.filter(i => i.pdf).length,      icon: <MdPictureAsPdf />, accent: '#22d3a5' },
          { label: 'May Cover', val: items.filter(i => i.cover).length,    icon: <MdImage />, accent: '#f5b942' },
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
            <MdSearch size={16} className="ep-search-icon" />
            <input
              className="ep-search"
              placeholder="Hanapin ang sipi…"
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
                  <th>Libro</th>
                  <th>May-akda</th>
                  <th>Tag</th>
                  <th>Taon</th>
                  <th>PDF</th>
                  <th>Aksyon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="ep-empty">Walang nahanap na sipi.</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="ep-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.cover
                          ? <img src={item.cover.startsWith('/') ? item.cover : item.cover.startsWith('http') ? item.cover : `/${item.cover}`} alt=""
                              style={{ width: 30, height: 42, objectFit: 'cover', borderRadius: 4,
                                border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }} />
                          : <div style={{ width: 30, height: 42, background: 'var(--bg-3)', borderRadius: 4,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, border: '1px solid var(--border)', flexShrink: 0 }}>📖</div>
                        }
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-1)', display: 'block', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                            {item.bookTitle}
                          </span>
                          {item.excerpt && (
                            <span style={{ color: 'var(--text-3)', fontSize: 11.5, fontStyle: 'italic',
                              display: 'block', maxWidth: 200, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{item.excerpt}"
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{item.author || '—'}</td>
                    <td>
                      {item.tag
                        ? <span className="ep-pill" style={{
                            background: 'rgba(108,99,255,0.1)', color: '#a89cff',
                            border: '1px solid rgba(108,99,255,0.2)' }}>
                            {item.tag}
                          </span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{item.year || '—'}</td>
                    <td>
                      {item.pdf
                        ? <a href={item.pdf} target="_blank" rel="noopener noreferrer">
                            <span className="ep-pill ep-pill--admin">May PDF</span>
                          </a>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td>
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        <button
                          className="ep-kebab-btn"
                          onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        >
                          <MdMoreVert size={20} />
                        </button>
                        {activeMenuId === item.id && (
                          <div className="ep-kebab-menu" style={{ right: '50%', transform: 'translateX(50%)' }}>
                            <button
                              className="ep-kebab-item"
                              onClick={() => { openEdit(item); setActiveMenuId(null); }}
                            >
                              Edit
                            </button>
                            <button
                              className="ep-kebab-item ep-kebab-item--danger"
                              onClick={() => { handleDelete(item.id, item.bookTitle); setActiveMenuId(null); }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
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
              {saveMsg && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="ep-spinner" style={{ width: 12, height: 12 }} />
                  {saveMsg}
                </p>
              )}
              <div className="ep-form-grid">

                <div className="ep-form-group ep-form-group--full">
                  <label>Pamagat ng Libro *</label>
                  <input ref={titleRef} value={form.bookTitle} className="ep-input"
                    placeholder="hal. Maynila sa mga Kuko ng Liwanag"
                    onChange={e => setForm(f => ({ ...f, bookTitle: e.target.value }))} />
                </div>

                <div className="ep-form-group">
                  <label>May-akda</label>
                  <input value={form.author} className="ep-input"
                    placeholder="Pangalan ng may-akda"
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                </div>

                <div className="ep-form-group">
                  <label>Tag</label>
                  <input value={form.tag} className="ep-input"
                    placeholder="hal. pag-ibig, kalayaan"
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
                </div>

                <div className="ep-form-group">
                  <label>Taon</label>
                  <input value={form.year} className="ep-input"
                    placeholder="hal. 2024" maxLength={4}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                </div>

                <div className="ep-form-group ep-form-group--full">
                  <label>Cover Image (Mag-upload O Mag-paste ng URL)</label>
                  
                  {/* Preview */}
                  {(form.coverFile || form.cover) && (
                    <div style={{ marginBottom: 8 }}>
                      {form.coverFile && form.coverFile.size > 5 * 1024 * 1024 ? (
                        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Ang larawan ay masyadong malaki para i-preview, ngunit mai-upload ito nang maayos.</p>
                      ) : (
                        <img
                          src={form.coverFile ? URL.createObjectURL(form.coverFile) : form.cover}
                          alt="cover preview"
                          style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 6, objectFit: 'cover',
                            border: '1px solid var(--border)', backgroundColor: 'var(--bg-1)' }}
                        />
                      )}
                    </div>
                  )}

                  {/* File picker button */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="ep-btn ep-btn--ghost"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                      onClick={() => coverInput.current?.click()}
                    >
                      📁 Pumili ng larawan
                    </button>
                    {form.coverFile && (
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {form.coverFile.name}
                      </span>
                    )}
                    <input
                      ref={coverInput}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCoverFile}
                    />
                  </div>

                  <input
                    value={form.coverFile ? '' : form.cover}
                    className="ep-input"
                    style={{ marginTop: 8 }}
                    placeholder="…o i-paste ang image URL"
                    disabled={!!form.coverFile}
                    onChange={e => setForm(f => ({ ...f, cover: e.target.value, coverFile: null }))}
                  />
                  {form.coverFile && (
                    <button
                      type="button"
                      style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setForm(f => ({ ...f, coverFile: null }))
                        if (coverInput.current) coverInput.current.value = ''
                      }}
                    >
                      ✕ Alisin ang file
                    </button>
                  )}
                  {(form.cover || form.coverFile) && (
                    <button
                      type="button"
                      style={{ fontSize: 11, color: '#ff5f6d', marginTop: 4, marginLeft: form.coverFile ? 8 : 0,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setForm(f => ({ ...f, cover: '', coverFile: null }))
                        if (coverInput.current) coverInput.current.value = ''
                      }}
                    >
                      🗑 Alisin ang cover
                    </button>
                  )}
                </div>

                <div className="ep-form-group ep-form-group--full">
                  <label>PDF (Mag-upload O Mag-paste ng URL)</label>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="ep-btn ep-btn--ghost"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                      onClick={() => pdfInput.current?.click()}
                    >
                      📄 Pumili ng PDF
                    </button>
                    {form.pdfFile && (
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {form.pdfFile.name}
                        {' '}
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>
                          ({(form.pdfFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </span>
                    )}
                    <input
                      ref={pdfInput}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={handlePdfFile}
                    />
                  </div>

                  <input
                    value={form.pdfFile ? '' : form.pdf}
                    className="ep-input"
                    style={{ marginTop: 8 }}
                    placeholder="…o i-paste ang PDF URL"
                    disabled={!!form.pdfFile}
                    onChange={e => setForm(f => ({ ...f, pdf: e.target.value, pdfFile: null }))}
                  />
                  {form.pdfFile && (
                    <button
                      type="button"
                      style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setForm(f => ({ ...f, pdfFile: null }))
                        if (pdfInput.current) pdfInput.current.value = ''
                      }}
                    >
                      ✕ Alisin ang file
                    </button>
                  )}
                </div>

                <div className="ep-form-group ep-form-group--full">
                  <label>Sipi (Excerpt)</label>
                  <textarea value={form.excerpt} className="ep-input ep-textarea"
                    placeholder="I-paste ang sipi dito…" rows={5}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
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