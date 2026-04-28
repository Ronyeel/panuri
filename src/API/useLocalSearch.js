// src/API/useLocalSearch.js
// ─────────────────────────────────────────────────────────────────────────────
// Local full-text search hook.
// Searches the static site index (all pages, section by section) plus
// dynamically fetched Supabase records (books, excerpts, quizzes).
// No external dependency — works offline.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import staticIndex from '../data/staticIndex'

const DEBOUNCE_MS   = 180
const MAX_RESULTS   = 25
const MIN_QUERY_LEN = 1

// ── Tokenise a string into lowercase words ───────────────────────────────────
function tokenise(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .split(/\W+/)
    .filter(Boolean)
}

// ── Score a document against a query ────────────────────────────────────────
// Returns a number ≥ 0. Higher = better match. 0 = no match.
function score(doc, queryTokens) {
  const titleTokens = tokenise(doc.title)
  const bodyTokens  = tokenise(doc.body || '')
  const catTokens   = tokenise(doc.category || '')

  let total = 0

  for (const q of queryTokens) {
    // Exact title token match (highest priority)
    if (titleTokens.some(t => t === q))        total += 10
    // Title token starts with query
    else if (titleTokens.some(t => t.startsWith(q))) total += 6
    // Category match
    if (catTokens.some(t => t === q || t.startsWith(q))) total += 4
    // Body contains query substring
    if (bodyTokens.some(t => t === q))          total += 2
    else if (bodyTokens.some(t => t.startsWith(q))) total += 1
  }

  return total
}

// ── Extract a short contextual snippet from body ─────────────────────────────
function getSnippet(body = '', queryTokens, maxLen = 120) {
  if (!body) return ''

  const lower = body.toLowerCase()
  let best = -1

  for (const q of queryTokens) {
    const idx = lower.indexOf(q)
    if (idx !== -1) { best = idx; break }
  }

  if (best === -1) return body.slice(0, maxLen) + (body.length > maxLen ? '…' : '')

  const start = Math.max(0, best - 30)
  const end   = Math.min(body.length, start + maxLen)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < body.length ? '…' : ''
  return prefix + body.slice(start, end) + suffix
}



// ── Build dynamic records from Supabase ──────────────────────────────────────
async function fetchDynamic() {
  const [booksRes, excerptsRes, quizzesRes] = await Promise.allSettled([
    supabase.from('books').select('id, title, author, genre, year').limit(200),
    supabase.from('excerpts').select('id, title, excerpt_text, book_title').limit(200),
    supabase.from('quiz_sets').select('id, title, description, category').limit(200),
  ])

  const records = []

  // Books
  if (booksRes.status === 'fulfilled' && !booksRes.value.error) {
    for (const b of booksRes.value.data ?? []) {
      records.push({
        id:       `dyn-book-${b.id}`,
        title:    b.title,
        body:     `${b.title} ni ${b.author ?? ''}. ${b.genre ?? ''} ${b.year ?? ''}`.trim(),
        category: 'Libro',
        section:  'Mga Libro',
        path:     `/mga-libro`,
      })
    }
  }

  // Excerpts
  if (excerptsRes.status === 'fulfilled' && !excerptsRes.value.error) {
    for (const e of excerptsRes.value.data ?? []) {
      records.push({
        id:       `dyn-excerpt-${e.id}`,
        title:    e.title || e.book_title || 'Excerpt',
        body:     `${e.title ?? ''} ${e.book_title ?? ''} ${(e.excerpt_text ?? '').slice(0, 300)}`.trim(),
        category: 'Excerpts',
        section:  'Mga Sipi',
        path:     `/excerpts`,
      })
    }
  }

  // Quizzes
  if (quizzesRes.status === 'fulfilled' && !quizzesRes.value.error) {
    for (const q of quizzesRes.value.data ?? []) {
      records.push({
        id:       `dyn-quiz-${q.id}`,
        title:    q.title,
        body:     `${q.title} ${q.description ?? ''} ${q.category ?? ''}`.trim(),
        category: 'Pagsusulit',
        section:  'Quiz',
        path:     `/pagsusulit`,
      })
    }
  }

  return records
}

// ── Hook ──────────────────────────────────────────────────────────────────────
let dynamicCache = null
let dynamicFetchPromise = null

export function useSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const timerRef    = useRef(null)
  const cancelledRef = useRef(false)

  // Pre-fetch dynamic records once on first use (cached)
  const [dynamicReady, setDynamicReady] = useState(!!dynamicCache)

  useEffect(() => {
    if (dynamicCache) return

    if (!dynamicFetchPromise) {
      dynamicFetchPromise = fetchDynamic().then(data => {
        dynamicCache = data
        return data
      }).catch(() => {
        dynamicCache = [] // don't retry on failure
        return []
      })
    }

    dynamicFetchPromise.then(() => setDynamicReady(true))
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    cancelledRef.current = false

    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return

      try {
        const queryTokens = tokenise(trimmed)
        if (!queryTokens.length) { setResults([]); setLoading(false); return }

        const allDocs = [...staticIndex, ...(dynamicCache ?? [])]

        const scored = allDocs
          .map(doc => ({ doc, s: score(doc, queryTokens) }))
          .filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, MAX_RESULTS)

        if (cancelledRef.current) return

        const mapped = scored.map(({ doc }) => ({
          id:       doc.id,
          title:    doc.title,
          subtitle: doc.section || '',
          snippet:  getSnippet(doc.body, queryTokens),
          category: doc.category,
          path:     doc.path,
        }))

        setResults(mapped)
      } catch (err) {
        if (!cancelledRef.current) {
          console.error('Local search error:', err)
          setError('Hindi ma-proseso ang paghahanap.')
        }
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelledRef.current = true
      clearTimeout(timerRef.current)
    }
  }, [query, dynamicReady])

  return { results, loading, error }
}
