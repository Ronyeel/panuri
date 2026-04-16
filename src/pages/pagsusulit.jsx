// Pagsuslit.jsx
// Player-facing quiz. Supports multiple_choice, true_false, and essay.
// Saves attempts + responses to Supabase. Realtime: quiz sets refresh live.

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../API/supabase'
import { auth } from '../API/firebase'
import './pagsusulit.css'

const LETTERS = ['A', 'B', 'C', 'D']

function getVerdict(score, total) {
  const pct = total > 0 ? score / total : 0
  if (pct === 1)   return 'Perpekto! Tunay kang dalubhasà.'
  if (pct >= 0.8)  return 'Napakahusay! Malapit ka na sa katumbusan.'
  if (pct >= 0.6)  return 'Magaling! May kaalaman ka, ngunit lagi pang puwang para lumago.'
  if (pct >= 0.4)  return 'Hindi masama. Pag-aralan muli at subuking muli!'
  return 'Huwag panghinaan ng loob — ang kabiguan ay simula ng karunungan.'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Pagsuslit() {
  const [sets,    setSets]    = useState([])
  const [loading, setLoading] = useState(true)

  // Active quiz state
  const [activeSetId,   setActiveSetId]   = useState(null)
  const [questions,     setQuestions]     = useState([])
  const [currentIndex,  setCurrentIndex]  = useState(0)

  // Per-question answer state
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [selectedTF,  setSelectedTF]  = useState(null)
  const [essayText,   setEssayText]   = useState('')
  const [answered,    setAnswered]    = useState(false)
  const [score,       setScore]       = useState(0)

  // Name prompt before starting
  const [namePrompt,   setNamePrompt]   = useState(false)
  const [playerName,   setPlayerName]   = useState('')
  const [pendingSetId, setPendingSetId] = useState(null)

  // Attempt tracking
  const attemptIdRef = useRef(null)
  const responsesRef = useRef([])

  const [finished,   setFinished]   = useState(false)
  const [hasPending, setHasPending] = useState(false)

  // Pre-fill player name from Firebase
  useEffect(() => {
    const user = auth.currentUser
    if (user?.displayName) setPlayerName(user.displayName)
  }, [])

  // ── Fetch + realtime subscribe to quiz sets ───────────────────────────────

  useEffect(() => {
    let channel

    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('quiz_sets')
        .select('id, title, category, difficulty')
        .order('created_at', { ascending: true })

      if (!error && data?.length) {
        setSets(data)
        setPendingSetId(prev => prev ?? data[0].id)
      }
      setLoading(false)
    }

    load()

    // Realtime: reflect admin changes to sets instantly
    channel = supabase
      .channel('quiz_sets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_sets' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Start a quiz ──────────────────────────────────────────────────────────

  const startQuiz = useCallback(async (setId, name) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('set_id', setId)
      .order('order_index', { ascending: true })

    if (error || !data?.length) return

    const uid = auth.currentUser?.uid ?? null

    const { data: attempt, error: aErr } = await supabase
      .from('quiz_attempts')
      .insert([{
        set_id:          setId,
        user_uid:        uid,
        display_name:    name || 'Anonymous',
        total_questions: data.length,
        status:          'in_progress',
      }])
      .select('id')
      .single()

    if (aErr) { console.error(aErr); return }

    attemptIdRef.current = attempt.id
    responsesRef.current = []

    setQuestions(data)
    setActiveSetId(setId)
    setCurrentIndex(0)
    setSelectedIdx(null)
    setSelectedTF(null)
    setEssayText('')
    setAnswered(false)
    setScore(0)
    setFinished(false)
    setHasPending(false)
    setNamePrompt(false)
  }, [])

  const handleSelectSet = (setId) => {
    setPendingSetId(setId)
    setNamePrompt(true)
  }

  const handleNameSubmit = () => {
    if (pendingSetId) startQuiz(pendingSetId, playerName.trim())
  }

  // ── Current question helpers ──────────────────────────────────────────────

  const question    = questions[currentIndex]
  const total       = questions.length
  const progressPct = total > 0 ? ((currentIndex + (answered ? 1 : 0)) / total) * 100 : 0

  const handleChoose   = useCallback((idx) => { if (!answered) setSelectedIdx(idx) }, [answered])
  const handleChooseTF = useCallback((val) => { if (!answered) setSelectedTF(val)  }, [answered])

  // ── Submit answer ─────────────────────────────────────────────────────────

  const handleSubmitAnswer = useCallback(() => {
    if (!question) return

    let answerText = '', isCorrect = null, needsGrading = false

    if (question.type === 'multiple_choice') {
      if (selectedIdx === null) return
      answerText = String(selectedIdx)
      isCorrect  = selectedIdx === question.correct_index
    } else if (question.type === 'true_false') {
      if (selectedTF === null) return
      answerText = String(selectedTF)
      isCorrect  = selectedTF === question.correct_tf
    } else if (question.type === 'essay') {
      if (!essayText.trim()) return
      answerText   = essayText.trim()
      isCorrect    = null
      needsGrading = true
    }

    if (isCorrect === true) setScore(s => s + 1)
    setAnswered(true)

    responsesRef.current.push({
      attempt_id:    attemptIdRef.current,
      question_id:   question.id,
      answer_text:   answerText,
      is_correct:    isCorrect,
      needs_grading: needsGrading,
    })
  }, [question, selectedIdx, selectedTF, essayText])

  // ── Next question / finish ────────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= total) {
      const { error: rErr } = await supabase
        .from('quiz_responses')
        .insert(responsesRef.current)
      if (rErr) console.error(rErr)

      const pending    = responsesRef.current.some(r => r.needs_grading)
      const finalScore = responsesRef.current.filter(r => r.is_correct === true).length

      setHasPending(pending)

      await supabase
        .from('quiz_attempts')
        .update({
          score:       finalScore,
          status:      pending ? 'pending_review' : 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', attemptIdRef.current)

      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedIdx(null)
      setSelectedTF(null)
      setEssayText('')
      setAnswered(false)
    }
  }, [currentIndex, total])

  const handleRetry = () => {
    setActiveSetId(null)
    setFinished(false)
    setNamePrompt(true)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="pagsuslit" aria-label="Pagsuslit — Pagsusulit">
        <div className="pagsuslit-inner">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Naglo-load ng mga tanong…
          </div>
        </div>
      </section>
    )
  }

  if (sets.length === 0) {
    return (
      <section className="pagsuslit" aria-label="Pagsuslit — Pagsusulit">
        <div className="pagsuslit-inner">
          <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontFamily: "'Crimson Text', serif" }}>
            Wala pang mga tanong. Bumalik na lang mamaya!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="pagsuslit" aria-label="Pagsuslit — Pagsusulit">
      <div className="pagsuslit-inner">

        {/* ── Header ── */}
        <header className="pagsuslit-header">
          <div className="pagsuslit-eyebrow">Subukan ang Iyong Kaalaman</div>
          <h2 className="pagsuslit-title">Pagsuslit</h2>
          <p className="pagsuslit-subtitle">Piliin ang set at simulan ang pagsusulit</p>
        </header>

        {/* ── Name prompt modal ── */}
        {namePrompt && (
          <div className="pagsuslit-name-backdrop" onClick={e => { if (e.target === e.currentTarget) setNamePrompt(false) }}>
            <div className="pagsuslit-name-modal">
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary, #e0e0e0)', fontSize: 18 }}>
                Ano ang iyong pangalan?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
                Para sa leaderboard at talaan ng pagsusulit
              </p>
              <input
                className="pagsuslit-name-input"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Ilagay ang iyong pangalan..."
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="pagsuslit-other-btn" style={{ flex: 1 }} onClick={() => setNamePrompt(false)}>
                  Kanselahin
                </button>
                <button className="pagsuslit-retry-btn" style={{ flex: 2 }} onClick={handleNameSubmit}>
                  Simulan →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Set selector ── */}
        {!activeSetId && (
          <nav className="pagsuslit-selector" aria-label="Mga set ng pagsusulit">
            {sets.map(s => (
              <button key={s.id} className="pagsuslit-selector-btn" onClick={() => handleSelectSet(s.id)}>
                {s.title}
                {s.category && (
                  <span style={{ display: 'block', fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    {s.category}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* ── Active quiz ── */}
        {activeSetId && (
          <div className="pagsuslit-card" role="main">

            {/* Results screen */}
            {finished ? (
              <div className="pagsuslit-results">
                <div className="pagsuslit-results-label">Iyong Puntos</div>
                <div className="pagsuslit-results-score">
                  {score}<span className="pagsuslit-results-denom">/{total}</span>
                </div>
                <p className="pagsuslit-results-verdict">{getVerdict(score, total)}</p>

                {hasPending && (
                  <div style={{
                    margin: '16px 0', padding: '12px 16px',
                    background: '#F59E0B18', border: '1px solid #F59E0B44',
                    borderRadius: 10, color: '#fbbf24',
                    fontSize: 13, textAlign: 'center', lineHeight: 1.6,
                  }}>
                    May mga sanaysay na kailangan pang suriin ng admin.<br />
                    <span style={{ opacity: 0.7 }}>Ang iyong puntos ay mababago pagkatapos ng pagsusuri.</span>
                  </div>
                )}

                <div className="pagsuslit-results-actions">
                  <button className="pagsuslit-retry-btn" onClick={handleRetry}>↩ Ulit</button>
                  {sets.length > 1 && (
                    <button className="pagsuslit-other-btn" onClick={() => { setActiveSetId(null); setFinished(false) }}>
                      Ibang Set
                    </button>
                  )}
                </div>
              </div>

            ) : question ? (
              <>
                {/* Progress bar */}
                <div className="pagsuslit-progress">
                  <div className="pagsuslit-progress-track" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={total}>
                    <div className="pagsuslit-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="pagsuslit-progress-label">
                    <span>{currentIndex + 1}</span> / {total}
                  </div>
                </div>

                {/* Question type badge */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: question.type === 'essay' ? '#8B5CF622' : question.type === 'true_false' ? '#10B98122' : '#3B82F622',
                    color:      question.type === 'essay' ? '#a78bfa'   : question.type === 'true_false' ? '#34d399'   : '#60a5fa',
                    border: `1px solid ${question.type === 'essay' ? '#8B5CF644' : question.type === 'true_false' ? '#10B98144' : '#3B82F644'}`,
                  }}>
                    {question.type === 'essay' ? 'Sanaysay' : question.type === 'true_false' ? 'Tama o Mali' : 'Multiple Choice'}
                  </span>
                </div>

                {/* Question text */}
                <div className="pagsuslit-question-wrap">
                  <div className="pagsuslit-question-num">Tanong {currentIndex + 1}</div>
                  <p className="pagsuslit-question-text">{question.question}</p>
                </div>

                {/* Multiple choice */}
                {question.type === 'multiple_choice' && (
                  <div className="pagsuslit-choices" role="list">
                    {(question.choices ?? []).map((choice, idx) => {
                      let stateClass = ''
                      if (answered) {
                        if (idx === question.correct_index) stateClass = ' revealed'
                        else if (idx === selectedIdx)       stateClass = ' wrong'
                      } else if (idx === selectedIdx) {
                        stateClass = ' selected'
                      }
                      return (
                        <button
                          key={idx} role="listitem"
                          className={`pagsuslit-choice${stateClass}`}
                          onClick={() => handleChoose(idx)}
                          disabled={answered}
                          aria-pressed={selectedIdx === idx}
                        >
                          <span className="pagsuslit-choice-letter">{LETTERS[idx]}</span>
                          <span className="pagsuslit-choice-text">{choice}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* True / False */}
                {question.type === 'true_false' && (
                  <div className="pagsuslit-choices" role="list">
                    {[true, false].map((val, idx) => {
                      let stateClass = ''
                      if (answered) {
                        if (val === question.correct_tf) stateClass = ' revealed'
                        else if (val === selectedTF)     stateClass = ' wrong'
                      } else if (val === selectedTF) {
                        stateClass = ' selected'
                      }
                      return (
                        <button
                          key={String(val)} role="listitem"
                          className={`pagsuslit-choice${stateClass}`}
                          onClick={() => handleChooseTF(val)}
                          disabled={answered}
                          aria-pressed={selectedTF === val}
                        >
                          <span className="pagsuslit-choice-letter">{idx === 0 ? 'T' : 'F'}</span>
                          <span className="pagsuslit-choice-text">{val ? 'Tama (True)' : 'Mali (False)'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Essay */}
                {question.type === 'essay' && (
                  <div style={{ marginTop: 16 }}>
                    {!answered ? (
                      <textarea
                        value={essayText}
                        onChange={e => setEssayText(e.target.value)}
                        rows={5}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'var(--bg-input, #1a1a2e)',
                          border: '1.5px solid var(--border, #ffffff18)',
                          borderRadius: 10,
                          color: 'var(--text-primary, #e0e0e0)',
                          fontSize: 15, lineHeight: 1.7,
                          padding: '12px 14px',
                          resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={e  => { e.target.style.borderColor = 'rgba(99,102,241,0.6)' }}
                        onBlur={e   => { e.target.style.borderColor = 'var(--border, #ffffff18)' }}
                        placeholder="Isulat ang iyong sagot dito..."
                      />
                    ) : (
                      <div style={{
                        padding: '12px 14px', background: '#6366f112',
                        border: '1.5px solid #6366f130', borderRadius: 10,
                        color: '#c4b5fd', fontSize: 14, lineHeight: 1.7,
                      }}>
                        {essayText}
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation (MC / TF) */}
                {answered && question.explanation && question.type !== 'essay' && (
                  <div className="pagsuslit-explanation" role="alert">
                    <span className="pagsuslit-explanation-icon">
                      {(selectedIdx === question.correct_index || selectedTF === question.correct_tf) ? '✓' : '✕'}
                    </span>
                    <p className="pagsuslit-explanation-text">{question.explanation}</p>
                  </div>
                )}

                {/* Essay submitted notice */}
                {answered && question.type === 'essay' && (
                  <div className="pagsuslit-explanation" role="alert" style={{ borderColor: '#6366f144', background: '#6366f112' }}>
                    <span className="pagsuslit-explanation-icon" style={{ color: '#a78bfa' }}>✎</span>
                    <p className="pagsuslit-explanation-text" style={{ color: '#c4b5fd' }}>
                      Ang iyong sagot ay nai-submit na. Susuriin ito ng admin.
                    </p>
                  </div>
                )}

                {/* Card footer */}
                <div className="pagsuslit-card-footer">
                  <div className="pagsuslit-score-inline">Puntos: <span>{score}</span></div>
                  {!answered ? (
                    <button
                      className="pagsuslit-next-btn"
                      onClick={handleSubmitAnswer}
                      disabled={
                        question.type === 'multiple_choice' ? selectedIdx === null :
                        question.type === 'true_false'      ? selectedTF  === null :
                        !essayText.trim()
                      }
                    >
                      Isumite →
                    </button>
                  ) : (
                    <button className="pagsuslit-next-btn" onClick={handleNext}>
                      {currentIndex + 1 >= total ? 'Tingnan ang Resulta →' : 'Susunod →'}
                    </button>
                  )}
                </div>
              </>

            ) : (
              <p style={{ color: 'var(--text-muted)', fontFamily: "'Crimson Text', serif", textAlign: 'center', padding: '2rem 0' }}>
                Walang mga tanong para sa set na ito.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .pagsuslit-name-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .pagsuslit-name-modal {
          background: var(--bg-card, #141428);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 28px 24px;
          width: 100%; max-width: 380px;
        }
        .pagsuslit-name-input {
          width: 100%; box-sizing: border-box;
          background: var(--bg-input, #1a1a2e);
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 8px; color: var(--text-primary, #e0e0e0);
          font-size: 15px; padding: 10px 14px;
          outline: none; font-family: inherit; transition: border-color 0.2s;
        }
        .pagsuslit-name-input:focus { border-color: rgba(99,102,241,0.6); }
        .pagsuslit-choice.selected {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.08);
        }
      `}</style>
    </section>
  )
}