// Pagsuslit.jsx
// Player-facing quiz. Supports multiple_choice, true_false, and essay.
// Saves attempts + responses to Supabase. Realtime: quiz sets refresh live.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../API/supabase'
import { auth } from '../API/firebase'
import './pagsusulit.css'

const LETTERS = ['A', 'B', 'C', 'D']

const DIFFICULTY_META = {
  easy: 'Madali',
  medium: 'Katamtaman',
  hard: 'Mahirap'
}

const SET_TYPE_META = {
  multiple_choice: 'Multiple Choice',
  true_false: 'Tama o Mali',
  essay: 'Sanaysay',
  halo: 'Halo (Mixed)',
}

function getVerdict(score, total) {
  const pct = total > 0 ? score / total : 0
  if (pct === 1) return 'Perpekto! Tunay kang dalubhasà.'
  if (pct >= 0.8) return 'Napakahusay! Malapit ka na sa katumbusan.'
  if (pct >= 0.6) return 'Magaling! May kaalaman ka, ngunit lagi pang puwang para lumago.'
  if (pct >= 0.4) return 'Hindi masama. Pag-aralan muli at subuking muli!'
  return 'Huwag panghinaan ng loob — ang kabiguan ay simula ng karunungan.'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Pagsuslit() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

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

  // Active quiz state
  const [activeSetId, setActiveSetId] = useState(null)
  const activeSetIdRef = useRef(null)
  useEffect(() => { activeSetIdRef.current = activeSetId }, [activeSetId])
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Per-question answer state
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [selectedTF, setSelectedTF] = useState(null)
  const [essayText, setEssayText] = useState('')
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  // Attempt tracking
  const attemptIdRef = useRef(null)
  const responsesRef = useRef([])
  const [responses, setResponses] = useState([])

  const [finished, setFinished] = useState(false)
  const [hasPending, setHasPending] = useState(false)

  // Retake warning modal
  const [pendingRetake, setPendingRetake] = useState(null)
  const [deletingRetake, setDeletingRetake] = useState(false)

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const filteredSets = (() => {
    const term = searchTerm.toLowerCase().trim()
    return sets
      .filter(s => {
        const matchDiff = filterDifficulty ? s.difficulty === filterDifficulty : true
        const matchCat  = filterCategory   ? s.category  === filterCategory   : true
        if (!matchDiff || !matchCat) return false
        if (!term) return true
        return (
          s.title.toLowerCase().includes(term) ||
          (s.category    && s.category.toLowerCase().includes(term)) ||
          (s.description && s.description.toLowerCase().includes(term))
        )
      })
      .sort((a, b) => {
        if (!term) return 0
        const score = s => {
          const title = s.title.toLowerCase()
          const cat   = (s.category    || '').toLowerCase()
          const desc  = (s.description || '').toLowerCase()
          if (title === term)         return 0
          if (title.startsWith(term)) return 1
          if (title.includes(term))   return 2
          if (cat.startsWith(term))   return 3
          if (cat.includes(term))     return 4
          if (desc.includes(term))    return 5
          return 6
        }
        return score(a) - score(b)
      })
  })()

  // ── Pre-fill search from global navbar (?q=) ─────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q && !activeSetId) {
      setSearchTerm(q)
      window.history.replaceState(null, '', location.pathname)
    }
  }, [location.search, activeSetId])

  // ── Fetch + realtime subscribe to quiz sets ───────────────────────────────

  const fetchSets = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true)
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('*, quiz_questions(count)')
      .order('created_at', { ascending: true })

    if (!error) {
      setSets(data || [])
    }
    if (isInitial) setLoading(false)
  }, [])

  const fetchQuestions = useCallback(async (setId) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('set_id', setId)
      .order('order_index', { ascending: true })
    if (!error && data) {
      setQuestions(data)
    }
  }, [])

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`pagsusulit_sync_${Date.now()}_${Math.random()}`, {
      config: { presence: { key: 'pagsusulit' } }
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_sets' }, () => {
        fetchSets(false)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_questions' }, () => {
        fetchSets(false)
        if (activeSetIdRef.current) fetchQuestions(activeSetIdRef.current)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_attempts' }, (payload) => {
        if (attemptIdRef.current && payload.new.id === attemptIdRef.current) {
          setScore(payload.new.score)
          setHasPending(payload.new.status === 'pending_review')
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_responses' }, (payload) => {
        if (attemptIdRef.current && payload.new.attempt_id === attemptIdRef.current) {
          setResponses(prev => {
            const next = prev.map(r => r.question_id === payload.new.question_id ? { ...r, ...payload.new } : r)
            responsesRef.current = next
            return next
          })
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchSets(false)
          if (activeSetIdRef.current) fetchQuestions(activeSetIdRef.current)
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          fetchSets(false)
          if (activeSetIdRef.current) fetchQuestions(activeSetIdRef.current)
          clearTimeout(retryTimerRef.current)
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) subscribe()
          }, 3000)
        }
      })

    channelRef.current = channel
  }, [fetchSets, fetchQuestions])

  useEffect(() => {
    fetchSets(true)
    subscribe()
  }, [fetchSets, subscribe])

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
        set_id: setId,
        user_uid: uid,
        display_name: name || 'Anonymous',
        total_questions: data.length,
        status: 'in_progress',
      }])
      .select('id')
      .single()

    if (aErr) { console.error(aErr); return }

    attemptIdRef.current = attempt.id
    responsesRef.current = []
    setResponses([])

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
  }, [])

  const handleSelectSet = async (setId) => {
    const user = auth.currentUser;
    const uid = user?.uid;
    const name = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';

    if (uid) {
      // Check if ANY attempt already exists for this user+set (not just maybeSingle)
      const { data: existing } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('set_id', setId)
        .eq('user_uid', uid)
        .limit(1)

      if (existing && existing.length > 0) {
        // Store ALL attempt IDs so we delete them all on confirm
        const { data: allAttempts } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('set_id', setId)
          .eq('user_uid', uid)

        setPendingRetake({ setId, attemptIds: allAttempts.map(a => a.id), name })
        return
      }
    }

    startQuiz(setId, name);
  }

  const confirmRetake = async () => {
    if (!pendingRetake) return;
    setDeletingRetake(true);

    // Delete ALL old responses and attempts for this user+set
    const { attemptIds, setId, name } = pendingRetake;
    for (const id of attemptIds) {
      await supabase.from('quiz_responses').delete().eq('attempt_id', id);
    }
    await supabase.from('quiz_attempts').delete().in('id', attemptIds);

    setPendingRetake(null);
    setDeletingRetake(false);

    startQuiz(setId, name);
  }

  const cancelRetake = () => {
    setPendingRetake(null);
  }

  // ── Current question helpers ──────────────────────────────────────────────

  const question = questions[currentIndex]
  const total = questions.length
  const progressPct = total > 0 ? ((currentIndex + (answered ? 1 : 0)) / total) * 100 : 0

  const handleChoose = useCallback((idx) => { if (!answered) setSelectedIdx(idx) }, [answered])
  const handleChooseTF = useCallback((val) => { if (!answered) setSelectedTF(val) }, [answered])

  // ── Submit answer ─────────────────────────────────────────────────────────

  const handleSubmitAnswer = useCallback(() => {
    if (!question) return

    let answerText = '', isCorrect = null, needsGrading = false

    if (question.type === 'multiple_choice') {
      if (selectedIdx === null) return
      answerText = String(selectedIdx)
      isCorrect = selectedIdx === question.correct_index
    } else if (question.type === 'true_false') {
      if (selectedTF === null) return
      answerText = String(selectedTF)
      isCorrect = selectedTF === question.correct_tf
    } else if (question.type === 'essay') {
      if (!essayText.trim()) return
      answerText = essayText.trim()
      isCorrect = null
      needsGrading = true
    }

    if (isCorrect === true) setScore(s => s + 1)
    setAnswered(true)

    responsesRef.current.push({
      attempt_id: attemptIdRef.current,
      question_id: question.id,
      answer_text: answerText,
      is_correct: isCorrect,
      needs_grading: needsGrading,
    })
    setResponses([...responsesRef.current])
  }, [question, selectedIdx, selectedTF, essayText])

  // ── Next question / finish ────────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= total) {
      const { data, error: rErr } = await supabase
        .from('quiz_responses')
        .insert(responsesRef.current)
        .select()
      if (rErr) console.error(rErr)
      else if (data) {
        responsesRef.current = data
        setResponses(data)
      }

      const pending = responsesRef.current.some(r => r.needs_grading)
      const finalScore = responsesRef.current.filter(r => r.is_correct === true).length

      setHasPending(pending)

      await supabase
        .from('quiz_attempts')
        .update({
          score: finalScore,
          status: pending ? 'pending_review' : 'completed',
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
    if (activeSetId) {
      // Always go through handleSelectSet so the warning modal fires
      handleSelectSet(activeSetId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="pagsuslit" aria-label="Pagsusulit — Pagsusulit">
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
      <section className="pagsuslit" aria-label="Pagsusulit — Pagsusulit">
        <div className="pagsuslit-inner">
          <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontFamily: "'Crimson Text', serif" }}>
            Wala pang mga tanong. Bumalik na lang mamaya!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="pagsuslit" aria-label="Pagsusulit — Pagsusulit">

      {/* Warning Modal for Retaking Quiz */}
      {pendingRetake && (
        <div className="pagsuslit-modal-overlay">
          <div className="pagsuslit-modal" role="dialog" aria-modal="true" style={{ textAlign: 'center' }}>
            <h2 className="pagsuslit-modal-title" style={{ color: 'var(--red)' }}>Uulitin ang Pagsusulit?</h2>
            <p className="pagsuslit-modal-desc">
              Mayroon ka nang nakaraang record para sa pagsusulit na ito.
              Kung uulitin mo ito, <strong>MABUBURA</strong> ang iyong nakaraang iskor at mga sagot.
              Gusto mo bang ituloy?
            </p>
            <div className="pagsuslit-modal-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button
                className="pagsuslit-modal-btn pagsuslit-modal-btn--secondary"
                onClick={cancelRetake}
                disabled={deletingRetake}
              >
                Kanselahin
              </button>
              <button
                className="pagsuslit-modal-btn pagsuslit-modal-btn--primary"
                onClick={confirmRetake}
                disabled={deletingRetake}
              >
                {deletingRetake ? 'Binubura...' : 'Burahin at Ulitin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pagsuslit-inner">

        {/* ── Header ── */}
        {!activeSetId && (
          <header style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #333', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f5c518', color: 'black', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 700, fontSize: '2rem', color: '#d4a300', margin: '0 0 0.2rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>PAGSUSULIT</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#aaa', margin: 0 }}>Subukan ang iyong kaalaman sa iba't ibang paksa</p>
            </div>
          </header>
        )}


        {/* ── Set selector ── */}
        {!activeSetId && (() => {
          const allCategories = Array.from(new Set(sets.map(s => s.category).filter(Boolean)));

          return (
            <div className="pagsuslit-grid-container">
              <div className="pagsuslit-search-bar">
                <span className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Maghanap ng pagsusulit..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="pagsuslit-filters">
                <span className="filter-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                </span>
                <select
                  className="pagsuslit-filter-dropdown"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">Lahat ng Kategorya</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  className="pagsuslit-filter-dropdown"
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                >
                  <option value="">Lahat ng Difficulty</option>
                  <option value="easy">Madali</option>
                  <option value="medium">Katamtaman</option>
                  <option value="hard">Mahirap</option>
                </select>
              </div>

              <div className="pagsuslit-results-count">
                Nahanap: <span>{filteredSets.length}</span> na Pagsusulit
              </div>

              <div className="pagsuslit-grid">
                {filteredSets.map(s => {
                  // Determine difficulty safely or default to 'medium'
                  const diffVal = s.difficulty || 'medium';
                  const diffLabel = DIFFICULTY_META[diffVal] || 'Katamtaman';
                  const diffClass = `diff-${diffVal}`;

                  // Dynamic metadata
                  const qCount = s.quiz_questions?.[0]?.count ?? 0;
                  const category = s.category || 'iba\'t ibang paksa';

                  return (
                    <div
                      key={s.id}
                      className="pagsuslit-grid-card"
                    >
                      <div className="card-top-bar"></div>
                      <div className="card-header">
                        <h3 className="card-title">{s.title}</h3>
                        <span className={`card-badge ${diffClass}`}>{diffLabel}</span>
                      </div>
                      <p className="card-subtitle">
                        {s.description || `Subukan ang iyong kaalaman sa mga pangunahing konsepto ng ${category}.`}
                      </p>

                      <div className="card-meta">
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          {qCount} tanong
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                          {s.category || 'General'}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                          {SET_TYPE_META[s.set_type] || 'Halo (Mixed)'}
                        </span>
                      </div>

                      <div className="card-footer-action">
                        <button className="card-action-btn" onClick={() => handleSelectSet(s.id)}>
                          Magsimula
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}


        {/* ── Active quiz ── */}
        {activeSetId && (() => {
          const activeSet = sets.find(s => s.id === activeSetId);

          return (
            <div className="pagsuslit-taking-container" role="main">

              {/* Results screen */}
              {finished ? (
                <div className="pagsuslit-card pagsuslit-results">
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

                  {/* ── Summary of Answers ── */}
                  <div className="pagsuslit-summary" style={{ marginTop: '3rem', textAlign: 'left', width: '100%' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', color: '#d4a300', fontSize: '1.2rem', fontFamily: "'Georgia', serif", marginBottom: '1.5rem' }}>Buod ng mga Sagot</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {questions.map((q, i) => {
                        const r = responses[i];
                        if (!r) return null;

                        let displayAnswer = r.answer_text;
                        let correctDisplay = null;

                        if (q.type === 'multiple_choice') {
                          const idx = parseInt(r.answer_text, 10);
                          displayAnswer = isNaN(idx) ? r.answer_text : (q.choices?.[idx] ?? r.answer_text);
                          correctDisplay = q.choices?.[q.correct_index] ?? '—';
                        }
                        if (q.type === 'true_false') {
                          displayAnswer = r.answer_text === 'true' ? 'Tama (True)' : 'Mali (False)';
                          correctDisplay = q.correct_tf ? 'Tama (True)' : 'Mali (False)';
                        }

                        const isCorrect = r.is_correct;
                        const needsGrading = r.needs_grading;

                        let bgColor = 'rgba(255,255,255,0.02)';
                        let borderColor = 'rgba(255,255,255,0.06)';
                        let icon = '';

                        if (needsGrading) {
                          borderColor = 'rgba(245,185,66,0.3)';
                          icon = '⏳ Pending';
                        } else if (isCorrect === true) {
                          borderColor = 'rgba(34,211,165,0.3)';
                          icon = '✓ Tama';
                        } else if (isCorrect === false) {
                          borderColor = 'rgba(255,95,109,0.3)';
                          icon = '✕ Mali';
                        }

                        return (
                          <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                TANONG {i + 1}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isCorrect ? '#22d3a5' : needsGrading ? '#f5b942' : '#ff5f6d' }}>
                                {icon}
                              </span>
                            </div>

                            <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e0e0e0', lineHeight: 1.5 }}>
                              {q.question}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ opacity: 0.5, fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Iyong sagot</span>
                                <span style={{ color: needsGrading ? '#c4b5fd' : isCorrect ? '#22d3a5' : '#ff5f6d' }}>{displayAnswer}</span>
                              </div>

                              {!needsGrading && !isCorrect && (
                                <div style={{ background: 'rgba(34,211,165,0.05)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(34,211,165,0.1)' }}>
                                  <span style={{ opacity: 0.6, fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22d3a5' }}>Tamang sagot</span>
                                  <span style={{ color: '#22d3a5' }}>{correctDisplay}</span>
                                </div>
                              )}
                            </div>

                            {q.explanation && !needsGrading && (
                              <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #4fa3e8', borderRadius: '0 6px 6px 0', fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
                                {q.explanation}
                              </div>
                            )}
                            {r.admin_feedback && (
                              <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #a78bfa', borderRadius: '0 6px 6px 0', fontSize: '0.85rem', color: '#c4b5fd', lineHeight: 1.5 }}>
                                <strong style={{display: 'block', marginBottom: '4px'}}>Feedback mula sa Admin:</strong>
                                {r.admin_feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              ) : question ? (
                <>
                  {/* New Quiz Header */}
                  <div className="quiz-header-layout">
                    <div className="quiz-header-left">
                      <div className="quiz-header-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                      </div>
                      <div>
                        <h2 className="quiz-header-title">{activeSet?.title}</h2>
                        <p className="quiz-header-subtitle">{activeSet?.category || 'Walang kategorya'}</p>
                      </div>
                    </div>
                    <button className="quiz-back-btn" onClick={() => { setActiveSetId(null); setFinished(false); }}>
                      ← Bumalik
                    </button>
                  </div>

                  <div className="pagsuslit-taking-layout">
                    {/* Left Panel - Question & Answers */}
                    <div className="pagsuslit-taking-main">
                      <div className="quiz-badge">Tanong {currentIndex + 1}</div>

                      <div className="pagsuslit-question-wrap">
                        <p className="pagsuslit-question-text">{question.question}</p>
                      </div>

                      {/* Multiple choice */}
                      {question.type === 'multiple_choice' && (
                        <div className="pagsuslit-choices" role="list">
                          {(question.choices ?? []).map((choice, idx) => {
                            let stateClass = ''
                            if (answered) {
                              if (idx === question.correct_index) stateClass = ' revealed'
                              else if (idx === selectedIdx) stateClass = ' wrong'
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
                              else if (val === selectedTF) stateClass = ' wrong'
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
                              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)' }}
                              onBlur={e => { e.target.style.borderColor = 'var(--border, #ffffff18)' }}
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
                        <div className="pagsuslit-explanation" role="alert" style={{ marginTop: '1.5rem' }}>
                          <span className="pagsuslit-explanation-icon">
                            {(selectedIdx === question.correct_index || selectedTF === question.correct_tf) ? '✓' : '✕'}
                          </span>
                          <p className="pagsuslit-explanation-text">{question.explanation}</p>
                        </div>
                      )}

                      {/* Essay submitted notice */}
                      {answered && question.type === 'essay' && (
                        <div className="pagsuslit-explanation" role="alert" style={{ marginTop: '1.5rem', borderColor: '#6366f144', background: '#6366f112' }}>
                          <span className="pagsuslit-explanation-icon" style={{ color: '#a78bfa' }}>✎</span>
                          <p className="pagsuslit-explanation-text" style={{ color: '#c4b5fd' }}>
                            Ang iyong sagot ay nai-submit na. Susuriin ito ng admin.
                          </p>
                        </div>
                      )}

                      {/* Card footer / Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
                        <button
                          className="pagsuslit-prev-btn"
                          disabled={true}
                        >
                          &lt; Nakaraan
                        </button>

                        {!answered ? (
                          <button
                            className="pagsuslit-next-btn"
                            onClick={handleSubmitAnswer}
                            disabled={
                              question.type === 'multiple_choice' ? selectedIdx === null :
                                question.type === 'true_false' ? selectedTF === null :
                                  !essayText.trim()
                            }
                          >
                            Isumite
                          </button>
                        ) : (
                          <button className="pagsuslit-next-btn" onClick={handleNext}>
                            {currentIndex + 1 >= total ? 'Tingnan ang Resulta >' : 'Susunod >'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Panel - Sidebar */}
                    <div className="pagsuslit-taking-sidebar">
                      <h3 className="sidebar-title">Mga Tanong</h3>
                      <div className="sidebar-grid">
                        {Array.from({ length: total }).map((_, i) => {
                          const isCurrent = i === currentIndex;
                          const isCompleted = i < currentIndex || (i === currentIndex && answered);

                          let className = 'sidebar-circle';
                          if (isCompleted) className += ' completed';
                          else if (isCurrent) className += ' current';

                          return (
                            <div key={i} className={className}>
                              {isCompleted ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                i + 1
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="sidebar-summary">
                        <div className="sidebar-summary-row">
                          <span>Nasagot:</span>
                          <span style={{ color: 'var(--gold)' }}>{currentIndex + (answered ? 1 : 0)} / {total}</span>
                        </div>
                        <div className="sidebar-summary-row">
                          <span>Progress:</span>
                          <span>{Math.round(((currentIndex + (answered ? 1 : 0)) / total) * 100)}%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </>

              ) : (
                <div className="pagsuslit-card">
                  <p style={{ color: 'var(--text-muted)', fontFamily: "'Crimson Text', serif", textAlign: 'center', padding: '2rem 0' }}>
                    Walang mga tanong para sa set na ito.
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <style>{`
        .pagsuslit-choice.selected {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.08);
        }
      `}</style>
    </section>
  )
}