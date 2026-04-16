// adminQuizGrading.jsx
// Admin page: manually grade essay responses and view attempt summaries.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../API/supabase'

const STATUS_COLORS = {
  completed:      { bg: '#10B98122', text: '#34d399', border: '#10B98144' },
  pending_review: { bg: '#F59E0B22', text: '#fbbf24', border: '#F59E0B44' },
  in_progress:    { bg: '#3B82F622', text: '#60a5fa', border: '#3B82F644' },
}

const STATUS_LABELS = {
  completed:      'Tapos na',
  pending_review: 'Para sa Pagsusuri',
  in_progress:    'In Progress',
}

export default function AdminQuizGrading() {
  const [tab,           setTab]           = useState('pending') // 'pending' | 'all'
  const [attempts,      setAttempts]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [responses,     setResponses]     = useState([])
  const [loadingR,      setLoadingR]      = useState(false)
  const [saving,        setSaving]        = useState({}) // { [responseId]: bool }

  // ── Fetch attempts ────────────────────────────────────────────────────────

  const fetchAttempts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('quiz_attempts')
      .select(`
        id, display_name, score, total_questions, status,
        started_at, finished_at,
        quiz_sets ( title, category )
      `)
      .order('finished_at', { ascending: false })

    if (tab === 'pending') {
      query = query.eq('status', 'pending_review')
    }

    const { data, error } = await query
    if (!error) setAttempts(data ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchAttempts() }, [fetchAttempts])

  // ── Fetch responses for an attempt ───────────────────────────────────────

  const openAttempt = async (attempt) => {
    setActiveAttempt(attempt)
    setLoadingR(true)

    const { data, error } = await supabase
      .from('quiz_responses')
      .select(`
        id, answer_text, is_correct, needs_grading, admin_feedback, graded_at,
        quiz_questions ( question, type, correct_tf, correct_index, choices, explanation )
      `)
      .eq('attempt_id', attempt.id)
      .order('created_at', { ascending: true })

    if (!error) setResponses(data ?? [])
    setLoadingR(false)
  }

  // ── Grade a single essay response ─────────────────────────────────────────

  const gradeResponse = async (responseId, isCorrect, feedback) => {
    setSaving(prev => ({ ...prev, [responseId]: true }))

    const { error } = await supabase
      .from('quiz_responses')
      .update({
        is_correct:     isCorrect,
        needs_grading:  false,
        admin_feedback: feedback || null,
        graded_at:      new Date().toISOString(),
      })
      .eq('id', responseId)

    if (!error) {
      // Update local responses list
      setResponses(prev =>
        prev.map(r =>
          r.id === responseId
            ? {
                ...r,
                is_correct:     isCorrect,
                needs_grading:  false,
                admin_feedback: feedback,
                graded_at:      new Date().toISOString(),
              }
            : r
        )
      )
      // Recalculate attempt score
      await recalcScore(activeAttempt.id)
    }

    setSaving(prev => ({ ...prev, [responseId]: false }))
  }

  const recalcScore = async (attemptId) => {
    const { data } = await supabase
      .from('quiz_responses')
      .select('is_correct, needs_grading')
      .eq('attempt_id', attemptId)

    if (!data) return

    const allGraded  = data.every(r => !r.needs_grading)
    const finalScore = data.filter(r => r.is_correct === true).length
    const status     = allGraded ? 'completed' : 'pending_review'

    await supabase
      .from('quiz_attempts')
      .update({ score: finalScore, status })
      .eq('id', attemptId)

    // Update local lists
    setAttempts(prev =>
      prev.map(a =>
        a.id === attemptId ? { ...a, score: finalScore, status } : a
      )
    )
    if (activeAttempt?.id === attemptId) {
      setActiveAttempt(prev => ({ ...prev, score: finalScore, status }))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────

  const pendingCount = attempts.filter(a => a.status === 'pending_review').length

  return (
    <div className="ep-page">
      <div className="ep-page-header">
        <div>
          <p className="ep-page-eyebrow">Palaisipan</p>
          <h1 className="ep-page-title">Grading ng Sanaysay</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          {
            key:   'pending',
            label: `Para sa Pagsusuri${pendingCount > 0 ? ` (${pendingCount})` : ''}`,
          },
          { key: 'all', label: 'Lahat ng Pagsubok' },
        ].map(t => (
          <button
            key={t.key}
            className={`ep-btn ${tab === t.key ? 'ep-btn--primary' : 'ep-btn--ghost'}`}
            onClick={() => { setTab(t.key); setActiveAttempt(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: activeAttempt ? '1fr 1.5fr' : '1fr',
        gap: 20,
      }}>

        {/* ── Attempts list ── */}
        <div className="ep-card">
          <div className="ep-card-header">
            <h2 className="ep-card-title">
              {tab === 'pending' ? 'Naghihintay ng Pagtatasa' : 'Lahat ng Attempt'}
            </h2>
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
                    <th>Mag-aaral</th>
                    <th>Set</th>
                    <th>Puntos</th>
                    <th>Status</th>
                    <th>Petsa</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ep-empty">
                        {tab === 'pending'
                          ? 'Wala pang naghihintay na sanaysay.'
                          : 'Wala pang attempt.'}
                      </td>
                    </tr>
                  ) : attempts.map(a => {
                    const sc   = STATUS_COLORS[a.status] ?? STATUS_COLORS.completed
                    const date = a.finished_at
                      ? new Date(a.finished_at).toLocaleDateString('fil-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : '—'

                    return (
                      <tr
                        key={a.id}
                        className={`ep-table-row${activeAttempt?.id === a.id ? ' ep-table-row--active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openAttempt(a)}
                      >
                        <td style={{ color: '#e0e0e0', fontWeight: 500 }}>
                          {a.display_name || 'Anonymous'}
                        </td>
                        <td style={{ color: '#aaa', fontSize: 12 }}>
                          {a.quiz_sets?.title ?? '—'}
                          {a.quiz_sets?.category && (
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {a.quiz_sets.category}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#e0e0e0' }}>
                          {a.score ?? 0}/{a.total_questions ?? 0}
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11,
                            fontWeight: 600, whiteSpace: 'nowrap',
                            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                          }}>
                            {STATUS_LABELS[a.status] ?? a.status}
                          </span>
                        </td>
                        <td style={{ color: '#666', fontSize: 12 }}>{date}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Response detail / grading panel ── */}
        {activeAttempt && (
          <div className="ep-card">
            <div className="ep-card-header">
              <div>
                <h2 className="ep-card-title">
                  {activeAttempt.display_name || 'Anonymous'}
                </h2>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {activeAttempt.quiz_sets?.title} · Puntos:{' '}
                  {activeAttempt.score}/{activeAttempt.total_questions}
                </p>
              </div>
              <button
                className="ep-btn ep-btn--ghost"
                onClick={() => setActiveAttempt(null)}
              >
                ✕
              </button>
            </div>

            {loadingR ? (
              <div className="ep-loading">
                <div className="ep-spinner" />
                <span>Naglo-load…</span>
              </div>
            ) : (
              <div style={{ padding: '0 0 16px' }}>
                {responses.length === 0 ? (
                  <p style={{
                    textAlign: 'center', padding: '2rem',
                    color: '#555', fontStyle: 'italic',
                  }}>
                    Walang mga sagot na nahanap.
                  </p>
                ) : responses.map((r, idx) => (
                  <ResponseCard
                    key={r.id}
                    response={r}
                    index={idx}
                    saving={!!saving[r.id]}
                    onGrade={gradeResponse}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Response card ─────────────────────────────────────────────────────────────

function ResponseCard({ response: r, index, saving, onGrade }) {
  const [feedback, setFeedback] = useState(r.admin_feedback ?? '')
  const q       = r.quiz_questions
  const isEssay = q?.type === 'essay'

  // Human-readable answer display
  let displayAnswer  = r.answer_text
  let correctDisplay = '—'

  if (q?.type === 'multiple_choice') {
    const idx      = parseInt(r.answer_text, 10)
    displayAnswer  = isNaN(idx) ? r.answer_text : (q.choices?.[idx] ?? r.answer_text)
    correctDisplay = q.choices?.[q.correct_index] ?? '—'
  }
  if (q?.type === 'true_false') {
    displayAnswer  = r.answer_text === 'true'
      ? 'Tama (True)'
      : r.answer_text === 'false'
        ? 'Mali (False)'
        : r.answer_text
    correctDisplay = q.correct_tf ? 'Tama (True)' : 'Mali (False)'
  }

  // Answer box color
  const answerBg     = r.is_correct === true  ? '#10B98114'
                     : r.is_correct === false ? '#EF444414'
                     : '#ffffff08'
  const answerBorder = r.is_correct === true  ? '#10B98144'
                     : r.is_correct === false ? '#EF444444'
                     : '#ffffff10'

  return (
    <div style={{
      margin: '0 16px 16px',
      border: '1px solid #ffffff0f',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: '#ffffff06',
        borderBottom: '1px solid #ffffff0f',
      }}>
        <span style={{ fontWeight: 500, color: '#e0e0e0', fontSize: 13 }}>
          Tanong {index + 1}
        </span>
        <span style={{
          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: isEssay            ? '#8B5CF622'
                    : q?.type === 'true_false' ? '#10B98122'
                    : '#3B82F622',
          color: isEssay            ? '#a78bfa'
               : q?.type === 'true_false' ? '#34d399'
               : '#60a5fa',
          border: `1px solid ${
            isEssay            ? '#8B5CF644'
            : q?.type === 'true_false' ? '#10B98144'
            : '#3B82F644'
          }`,
        }}>
          {isEssay
            ? 'Sanaysay'
            : q?.type === 'true_false'
              ? 'Tama o Mali'
              : 'Multiple Choice'}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        {/* Question text */}
        <p style={{ color: '#c0c0c0', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
          {q?.question}
        </p>

        {/* Student answer */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 11, color: '#666', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
          }}>
            Sagot ng Mag-aaral
          </div>
          <div style={{
            padding: '8px 12px',
            background: answerBg,
            border: `1px solid ${answerBorder}`,
            borderRadius: 6,
            color: '#e0e0e0',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            {isEssay
              ? (r.answer_text || <em style={{ color: '#555' }}>Walang sagot</em>)
              : displayAnswer}
          </div>
        </div>

        {/* Correct answer (non-essay only) */}
        {!isEssay && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 11, color: '#666', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
            }}>
              Tamang Sagot
            </div>
            <div style={{
              padding: '6px 12px',
              background: '#10B98114',
              border: '1px solid #10B98144',
              borderRadius: 6,
              color: '#34d399',
              fontSize: 13,
            }}>
              {correctDisplay}
            </div>
          </div>
        )}

        {/* Explanation (non-essay) */}
        {q?.explanation && !isEssay && (
          <div style={{
            marginBottom: 12, padding: '8px 12px',
            background: '#6366f10c', border: '1px solid #6366f122', borderRadius: 6,
          }}>
            <div style={{
              fontSize: 11, color: '#666', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
            }}>
              Paliwanag
            </div>
            <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {q.explanation}
            </p>
          </div>
        )}

        {/* Grading UI — essays only */}
        {isEssay && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 11, color: '#666', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
              }}>
                Feedback <span style={{ textTransform: 'none', fontWeight: 400 }}>(opsyonal)</span>
              </div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="ep-input ep-textarea"
                rows={2}
                placeholder="Isulat ang iyong komento para sa mag-aaral..."
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="ep-btn"
                disabled={saving}
                style={{
                  flex: 1,
                  background: '#10B98122',
                  color: '#34d399',
                  border: '1px solid #10B98144',
                  fontWeight: 600,
                  opacity: r.is_correct === true ? 1 : 0.65,
                  outline: r.is_correct === true ? '2px solid #10B981' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => onGrade(r.id, true, feedback)}
              >
                {saving ? '…' : '✓ Tama'}
              </button>
              <button
                className="ep-btn"
                disabled={saving}
                style={{
                  flex: 1,
                  background: '#EF444422',
                  color: '#f87171',
                  border: '1px solid #EF444444',
                  fontWeight: 600,
                  opacity: r.is_correct === false ? 1 : 0.65,
                  outline: r.is_correct === false ? '2px solid #EF4444' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => onGrade(r.id, false, feedback)}
              >
                {saving ? '…' : '✕ Mali'}
              </button>
            </div>

            {r.graded_at && (
              <p style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                Na-grade noong{' '}
                {new Date(r.graded_at).toLocaleString('fil-PH')}
              </p>
            )}

            {r.admin_feedback && !saving && (
              <div style={{
                marginTop: 8, padding: '6px 10px',
                background: '#ffffff08', border: '1px solid #ffffff12',
                borderRadius: 6, fontSize: 12, color: '#aaa',
              }}>
                <strong style={{ color: '#888' }}>Naunang feedback: </strong>
                {r.admin_feedback}
              </div>
            )}
          </>
        )}

        {/* Non-essay graded status */}
        {!isEssay && r.is_correct !== null && (
          <div style={{
            fontSize: 13,
            color:    r.is_correct ? '#34d399' : '#f87171',
            fontWeight: 600,
            marginTop: 4,
          }}>
            {r.is_correct ? '✓ Tama' : '✕ Mali'}
          </div>
        )}
      </div>
    </div>
  )
}