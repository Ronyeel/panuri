// adminQuizSets.jsx
// Admin page: manage quiz sets (folders) and their questions.
// Each set can hold multiple_choice, true_false, and essay questions.

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../API/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS = {
  easy:   '#10B981',
  medium: '#F59E0B',
  hard:   '#EF4444',
}

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  true_false:      'Tama o Mali',
  essay:           'Sanaysay',
}

const EMPTY_SET = {
  title:       '',
  description: '',
  category:    '',
  difficulty:  'medium',
}

const EMPTY_QUESTION = {
  type:          'multiple_choice',
  question:      '',
  choices:       ['', '', '', ''],
  correct_index: 0,
  correct_tf:    true,
  explanation:   '',
  order_index:   0,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateQuestion(q) {
  if (!q.question.trim()) return 'Kailangan ang tanong.'
  if (q.type === 'multiple_choice') {
    const filled = q.choices.filter(c => c.trim())
    if (filled.length < 2)                    return 'Kailangan ng hindi bababa sa 2 pagpipilian.'
    if (!q.choices[q.correct_index]?.trim())  return 'Ang tamang sagot ay walang laman.'
  }
  return ''
}

// ─── QuestionForm sub-component ──────────────────────────────────────────────

function QuestionForm({ form, onChange, error }) {
  const setChoice = (i, val) => {
    const choices = [...form.choices]
    choices[i] = val
    onChange({ ...form, choices })
  }

  return (
    <div className="ep-form-grid">
      {error && (
        <p className="ep-form-error" style={{ gridColumn: '1/-1' }}>{error}</p>
      )}

      {/* Question type */}
      <div className="ep-form-group">
        <label>Uri ng Tanong *</label>
        <select
          value={form.type}
          className="ep-input"
          onChange={e => onChange({ ...form, type: e.target.value })}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">Tama o Mali (True/False)</option>
          <option value="essay">Sanaysay (Essay)</option>
        </select>
      </div>

      {/* Order index */}
      <div className="ep-form-group">
        <label>Order</label>
        <input
          type="number"
          min="0"
          value={form.order_index}
          className="ep-input"
          onChange={e => onChange({ ...form, order_index: Number(e.target.value) })}
        />
      </div>

      {/* Question text */}
      <div className="ep-form-group ep-form-group--full">
        <label>Tanong *</label>
        <textarea
          value={form.question}
          rows={3}
          className="ep-input ep-textarea"
          placeholder="Isulat ang tanong dito..."
          onChange={e => onChange({ ...form, question: e.target.value })}
        />
      </div>

      {/* Multiple choice options */}
      {form.type === 'multiple_choice' && (
        <div className="ep-form-group ep-form-group--full">
          <label>
            Mga Pagpipilian *{' '}
            <span style={{ color: '#555', fontWeight: 400 }}>
              (lagyan ng tsek ang tamang sagot)
            </span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {form.choices.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="radio"
                  name={`correct-${form._uid ?? 'new'}`}
                  checked={form.correct_index === i}
                  onChange={() => onChange({ ...form, correct_index: i })}
                  style={{ accentColor: '#6366f1', width: 16, height: 16, flexShrink: 0 }}
                />
                <input
                  value={c}
                  onChange={e => setChoice(i, e.target.value)}
                  className="ep-input"
                  style={{ flex: 1 }}
                  placeholder={`Pagpipilian ${i + 1}${i < 2 ? ' *' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* True / False answer */}
      {form.type === 'true_false' && (
        <div className="ep-form-group ep-form-group--full">
          <label>Tamang Sagot *</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            {[true, false].map(val => (
              <label
                key={String(val)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name={`tf-${form._uid ?? 'new'}`}
                  checked={form.correct_tf === val}
                  onChange={() => onChange({ ...form, correct_tf: val })}
                  style={{ accentColor: '#6366f1' }}
                />
                <span style={{ color: '#e0e0e0' }}>
                  {val ? 'Tama (True)' : 'Mali (False)'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Essay notice */}
      {form.type === 'essay' && (
        <div className="ep-form-group ep-form-group--full">
          <div style={{
            padding: '10px 14px',
            background: '#6366f122',
            border: '1px solid #6366f144',
            borderRadius: 8,
            color: '#a5b4fc',
            fontSize: 13,
          }}>
            Ang mga sagot sa sanaysay ay susuriin mo nang manu-mano sa pahina ng Grading.
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="ep-form-group ep-form-group--full">
        <label>
          Paliwanag{' '}
          <span style={{ color: '#555', fontWeight: 400 }}>(opsyonal)</span>
        </label>
        <textarea
          value={form.explanation}
          rows={2}
          className="ep-input ep-textarea"
          placeholder="Ipaliwanag kung bakit ito ang tamang sagot..."
          onChange={e => onChange({ ...form, explanation: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminQuizSets() {
  // Sets list
  const [sets,        setSets]        = useState([])
  const [loadingSets, setLoadingSets] = useState(true)
  const [setSearch,   setSetSearch]   = useState('')

  // Set modal state
  const [setModal,   setSetModal]   = useState(false)
  const [setForm,    setSetForm]    = useState(EMPTY_SET)
  const [editingSet, setEditingSet] = useState(null)
  const [savingSet,  setSavingSet]  = useState(false)
  const [setError,   setSetError]   = useState('')

  // Question editor (shown when a set is expanded)
  const [activeSet,  setActiveSet]  = useState(null)
  const [questions,  setQuestions]  = useState([])
  const [loadingQ,   setLoadingQ]   = useState(false)
  const [qModal,     setQModal]     = useState(false)
  const [qForm,      setQForm]      = useState(EMPTY_QUESTION)
  const [editingQ,   setEditingQ]   = useState(null)
  const [savingQ,    setSavingQ]    = useState(false)
  const [qError,     setQError]     = useState('')

  const titleRef = useRef(null)

  // ── Fetch sets ────────────────────────────────────────────────────────────

  const fetchSets = useCallback(async () => {
    setLoadingSets(true)
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('*, quiz_questions(count)')
      .order('created_at', { ascending: false })
    if (!error) setSets(data ?? [])
    setLoadingSets(false)
  }, [])

  useEffect(() => { fetchSets() }, [fetchSets])

  // ── Fetch questions for a set ─────────────────────────────────────────────

  const fetchQuestions = useCallback(async (setId) => {
    setLoadingQ(true)
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('set_id', setId)
      .order('order_index', { ascending: true })
    if (!error) setQuestions(data ?? [])
    setLoadingQ(false)
  }, [])

  const openSet = (s) => {
    setActiveSet(s)
    fetchQuestions(s.id)
  }

  // ── Set CRUD ──────────────────────────────────────────────────────────────

  const openAddSet = () => {
    setSetForm(EMPTY_SET)
    setEditingSet(null)
    setSetError('')
    setSetModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const openEditSet = (s, e) => {
    e?.stopPropagation()
    setSetForm({
      title:       s.title,
      description: s.description ?? '',
      category:    s.category    ?? '',
      difficulty:  s.difficulty  ?? 'medium',
    })
    setEditingSet(s.id)
    setSetError('')
    setSetModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const closeSetModal = () => {
    setSetModal(false)
    setEditingSet(null)
    setSetError('')
  }

  const handleSaveSet = async () => {
    if (!setForm.title.trim()) { setSetError('Kailangan ang titulo ng set.'); return }
    setSavingSet(true)
    setSetError('')

    const payload = {
      title:       setForm.title.trim(),
      description: setForm.description.trim() || null,
      category:    setForm.category.trim()    || null,
      difficulty:  setForm.difficulty,
      updated_at:  new Date().toISOString(),
    }

    try {
      if (editingSet) {
        const { error } = await supabase.from('quiz_sets').update(payload).eq('id', editingSet)
        if (error) throw error
        // Refresh local active set title if it's the one being edited
        if (activeSet?.id === editingSet) {
          setActiveSet(prev => ({ ...prev, ...payload }))
        }
      } else {
        const { error } = await supabase.from('quiz_sets').insert([payload])
        if (error) throw error
      }
      await fetchSets()
      closeSetModal()
    } catch {
      setSetError('Hindi ma-save. Subukan ulit.')
    } finally {
      setSavingSet(false)
    }
  }

  const handleDeleteSet = async (id, title, e) => {
    e?.stopPropagation()
    if (!window.confirm(
      `Tanggalin ang set na "${title}"?\n\nMatatanggal din ang lahat ng tanong sa loob nito.`
    )) return

    const { error } = await supabase.from('quiz_sets').delete().eq('id', id)
    if (error) {
      alert('Hindi matanggal. Subukan ulit.')
    } else {
      setSets(prev => prev.filter(s => s.id !== id))
      if (activeSet?.id === id) setActiveSet(null)
    }
  }

  // ── Question CRUD ─────────────────────────────────────────────────────────

  const openAddQ = () => {
    setQForm({ ...EMPTY_QUESTION, order_index: questions.length, _uid: Date.now() })
    setEditingQ(null)
    setQError('')
    setQModal(true)
  }

  const openEditQ = (q) => {
    setQForm({
      _uid:          q.id,
      type:          q.type,
      question:      q.question,
      choices:       q.choices       ?? ['', '', '', ''],
      correct_index: q.correct_index ?? 0,
      correct_tf:    q.correct_tf    ?? true,
      explanation:   q.explanation   ?? '',
      order_index:   q.order_index   ?? 0,
    })
    setEditingQ(q.id)
    setQError('')
    setQModal(true)
  }

  const closeQModal = () => {
    setQModal(false)
    setEditingQ(null)
    setQError('')
  }

  const handleSaveQ = async () => {
    const err = validateQuestion(qForm)
    if (err) { setQError(err); return }
    setSavingQ(true)
    setQError('')

    const payload = {
      set_id:        activeSet.id,
      type:          qForm.type,
      question:      qForm.question.trim(),
      choices:       qForm.type === 'multiple_choice'
                       ? qForm.choices.map(c => c.trim())
                       : null,
      correct_index: qForm.type === 'multiple_choice' ? qForm.correct_index : null,
      correct_tf:    qForm.type === 'true_false'      ? qForm.correct_tf    : null,
      explanation:   qForm.explanation.trim() || null,
      order_index:   qForm.order_index,
    }

    try {
      if (editingQ) {
        const { error } = await supabase
          .from('quiz_questions').update(payload).eq('id', editingQ)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('quiz_questions').insert([payload])
        if (error) throw error
      }
      await fetchQuestions(activeSet.id)
      // Also refresh question count on the sets list
      await fetchSets()
      closeQModal()
    } catch {
      setQError('Hindi ma-save. Subukan ulit.')
    } finally {
      setSavingQ(false)
    }
  }

  const handleDeleteQ = async (id, text) => {
    if (!window.confirm(`Tanggalin ang tanong na ito?\n\n"${text}"`)) return
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) {
      alert('Hindi matanggal. Subukan ulit.')
    } else {
      setQuestions(prev => prev.filter(q => q.id !== id))
      await fetchSets() // refresh count
    }
  }

  // ── Filtered sets ─────────────────────────────────────────────────────────

  const filteredSets = sets.filter(s =>
    s.title?.toLowerCase().includes(setSearch.toLowerCase()) ||
    s.category?.toLowerCase().includes(setSearch.toLowerCase())
  )

  const totalQuestions = sets.reduce(
    (acc, s) => acc + (s.quiz_questions?.[0]?.count ?? 0), 0
  )

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="ep-page">
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Palaisipan</p>
          <h1 className="ep-page-title">Mga Set ng Quiz</h1>
        </div>
        <button className="ep-btn ep-btn--primary" onClick={openAddSet}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Bagong Set
        </button>
      </div>

      {/* Stats */}
      <div className="ep-stats-grid">
        {[
          { label: 'Kabuuang Set',    val: sets.length,    accent: '#3B82F6' },
          { label: 'Kabuuang Tanong', val: totalQuestions, accent: '#8B5CF6' },
        ].map(s => (
          <div className="ep-stat-card" key={s.label} style={{ '--accent': s.accent }}>
            <div>
              <p className="ep-stat-label">{s.label}</p>
              <p className="ep-stat-val">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeSet ? '1fr 1.4fr' : '1fr',
        gap: 20,
      }}>

        {/* ── Sets list ── */}
        <div className="ep-card">
          <div className="ep-card-header">
            <h2 className="ep-card-title">Lahat ng Set</h2>
            <div className="ep-search-wrap">
              <svg className="ep-search-icon" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ep-search"
                placeholder="Hanapin ang set..."
                value={setSearch}
                onChange={e => setSetSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingSets ? (
            <div className="ep-loading">
              <div className="ep-spinner" />
              <span>Naglo-load…</span>
            </div>
          ) : (
            <div className="ep-table-wrap">
              <table className="ep-table">
                <thead>
                  <tr>
                    <th>Titulo</th>
                    <th>Kategorya</th>
                    <th>Hirap</th>
                    <th>Tanong</th>
                    <th>Aksyon</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ep-empty">
                        Walang set na nahanap.
                      </td>
                    </tr>
                  ) : filteredSets.map(s => (
                    <tr
                      key={s.id}
                      className={`ep-table-row${activeSet?.id === s.id ? ' ep-table-row--active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openSet(s)}
                    >
                      <td style={{ color: '#e0e0e0', maxWidth: 180 }}>
                        <span style={{ fontWeight: 500 }}>{s.title}</span>
                        {s.description && (
                          <div style={{
                            fontSize: 11, color: '#888', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', maxWidth: 180,
                          }}>
                            {s.description}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#aaa' }}>{s.category || '—'}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 99, fontSize: 11,
                          fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                          background: (DIFFICULTY_COLORS[s.difficulty] ?? '#555') + '22',
                          color:      DIFFICULTY_COLORS[s.difficulty] ?? '#aaa',
                          border:     `1px solid ${DIFFICULTY_COLORS[s.difficulty] ?? '#555'}44`,
                        }}>
                          {s.difficulty}
                        </span>
                      </td>
                      <td style={{ color: '#aaa' }}>
                        {s.quiz_questions?.[0]?.count ?? 0}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="ep-actions">
                          <button
                            className="ep-btn ep-btn--ghost"
                            onClick={e => openEditSet(s, e)}
                          >
                            Edit
                          </button>
                          <button
                            className="ep-btn ep-btn--danger"
                            onClick={e => handleDeleteSet(s.id, s.title, e)}
                          >
                            Del
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

        {/* ── Question editor ── */}
        {activeSet && (
          <div className="ep-card">
            <div className="ep-card-header">
              <div>
                <h2 className="ep-card-title">{activeSet.title}</h2>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {questions.length} tanong
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ep-btn ep-btn--primary" onClick={openAddQ}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5"  y1="12" x2="19" y2="12"/>
                  </svg>
                  Tanong
                </button>
                <button
                  className="ep-btn ep-btn--ghost"
                  onClick={() => setActiveSet(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingQ ? (
              <div className="ep-loading">
                <div className="ep-spinner" />
                <span>Naglo-load…</span>
              </div>
            ) : (
              <div className="ep-table-wrap">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tanong</th>
                      <th>Uri</th>
                      <th>Aksyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ep-empty">
                          Wala pang tanong. Magdagdag na!
                        </td>
                      </tr>
                    ) : questions.map((q, idx) => (
                      <tr key={q.id} className="ep-table-row">
                        <td style={{ color: '#666', width: 32 }}>{idx + 1}</td>
                        <td style={{ color: '#e0e0e0', maxWidth: 260 }}>
                          <span style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {q.question}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11,
                            fontWeight: 600, whiteSpace: 'nowrap',
                            background: q.type === 'essay'
                              ? '#8B5CF622'
                              : q.type === 'true_false'
                                ? '#10B98122'
                                : '#3B82F622',
                            color: q.type === 'essay'
                              ? '#a78bfa'
                              : q.type === 'true_false'
                                ? '#34d399'
                                : '#60a5fa',
                            border: `1px solid ${
                              q.type === 'essay'
                                ? '#8B5CF644'
                                : q.type === 'true_false'
                                  ? '#10B98144'
                                  : '#3B82F644'
                            }`,
                          }}>
                            {QUESTION_TYPE_LABELS[q.type]}
                          </span>
                        </td>
                        <td>
                          <div className="ep-actions">
                            <button
                              className="ep-btn ep-btn--ghost"
                              onClick={() => openEditQ(q)}
                            >
                              Edit
                            </button>
                            <button
                              className="ep-btn ep-btn--danger"
                              onClick={() => handleDeleteQ(q.id, q.question)}
                            >
                              Del
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
        )}
      </div>

      {/* ── Set Modal ── */}
      {setModal && (
        <div
          className="ep-modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) closeSetModal() }}
        >
          <div className="ep-modal">
            <div className="ep-modal-header">
              <h2>{editingSet ? 'I-edit ang Set' : 'Bagong Set ng Quiz'}</h2>
              <button className="ep-modal-close" onClick={closeSetModal}>✕</button>
            </div>
            <div className="ep-modal-body">
              {setError && <p className="ep-form-error">{setError}</p>}
              <div className="ep-form-grid">

                <div className="ep-form-group ep-form-group--full">
                  <label>Titulo *</label>
                  <input
                    ref={titleRef}
                    value={setForm.title}
                    className="ep-input"
                    placeholder="hal. Pagsusulit sa Kasaysayan ng Pilipinas"
                    onChange={e => setSetForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div className="ep-form-group ep-form-group--full">
                  <label>
                    Paglalarawan{' '}
                    <span style={{ color: '#555', fontWeight: 400 }}>(opsyonal)</span>
                  </label>
                  <textarea
                    value={setForm.description}
                    rows={2}
                    className="ep-input ep-textarea"
                    placeholder="Maikling paglalarawan ng set na ito..."
                    onChange={e => setSetForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="ep-form-group">
                  <label>Kategorya</label>
                  <input
                    value={setForm.category}
                    className="ep-input"
                    placeholder="hal. Kasaysayan, Agham"
                    onChange={e => setSetForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>

                <div className="ep-form-group">
                  <label>Antas ng Hirap</label>
                  <select
                    value={setForm.difficulty}
                    className="ep-input"
                    onChange={e => setSetForm(f => ({ ...f, difficulty: e.target.value }))}
                  >
                    <option value="easy">Madali</option>
                    <option value="medium">Katamtaman</option>
                    <option value="hard">Mahirap</option>
                  </select>
                </div>

              </div>
            </div>
            <div className="ep-modal-footer">
              <button
                className="ep-btn ep-btn--ghost"
                onClick={closeSetModal}
                disabled={savingSet}
              >
                Kanselahin
              </button>
              <button
                className="ep-btn ep-btn--primary"
                onClick={handleSaveSet}
                disabled={savingSet}
              >
                {savingSet ? 'Sine-save…' : editingSet ? 'I-update' : 'Idagdag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Modal ── */}
      {qModal && (
        <div
          className="ep-modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) closeQModal() }}
        >
          <div className="ep-modal" style={{ maxWidth: 600 }}>
            <div className="ep-modal-header">
              <h2>
                {editingQ
                  ? 'I-edit ang Tanong'
                  : `Bagong Tanong — ${activeSet?.title}`}
              </h2>
              <button className="ep-modal-close" onClick={closeQModal}>✕</button>
            </div>
            <div className="ep-modal-body">
              <QuestionForm form={qForm} onChange={setQForm} error={qError} />
            </div>
            <div className="ep-modal-footer">
              <button
                className="ep-btn ep-btn--ghost"
                onClick={closeQModal}
                disabled={savingQ}
              >
                Kanselahin
              </button>
              <button
                className="ep-btn ep-btn--primary"
                onClick={handleSaveQ}
                disabled={savingQ}
              >
                {savingQ ? 'Sine-save…' : editingQ ? 'I-update' : 'Idagdag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}