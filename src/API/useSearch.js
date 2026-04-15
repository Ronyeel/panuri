import { useState, useEffect, useRef } from 'react'
import { supabase } from '../API/supabase'

// ─────────────────────────────────────────────
const STATIC_SOURCES = []

const DEBOUNCE_MS = 300
const MAX_RESULTS = 8

// ─────────────────────────────────────────────
// STATIC SEARCH
function searchStatic(query) {
  const lower = query.toLowerCase()
  const results = []

  for (const source of STATIC_SOURCES) {
    for (const item of source.data) {
      if (item.title?.toLowerCase().includes(lower)) {
        results.push({
          id:       `static-${source.category}-${item.slug}`,
          title:    item.title,
          category: source.category,
          path:     `${source.basePath}/${item.slug}`,
        })
      }
    }
  }

  return results
}

// ─────────────────────────────────────────────
// SUPABASE SEARCH
async function searchSupabase(query) {
  const pattern = `%${query}%`

  try {
    const [booksRes, excerptsRes] = await Promise.all([
      // ── BOOKS ─────────────────────────────
      supabase
        .from('books')
        .select('id, title, author')
        .or(`title.ilike.${pattern},author.ilike.${pattern}`)
        .limit(MAX_RESULTS),

      // ── EXCERPTS ──────────────────────────
      supabase
        .from('excerpts')
        .select('id, title, bookTitle')
        .or(`title.ilike.${pattern},bookTitle.ilike.${pattern}`)
        .limit(MAX_RESULTS),
    ])

    if (booksRes.error) console.error('Books error:', booksRes.error)
    if (excerptsRes.error) console.error('Excerpts error:', excerptsRes.error)

    // ── MAP BOOKS ──────────────────────────
    const books = (booksRes.data ?? []).map(item => ({
      id:       `book-${item.id}`,
      title:    item.title,
      category: 'Mga Libro',
      path:     `/mga-libro/${item.id}`,
      subtitle: item.author ?? '',
    }))

    // ── MAP EXCERPTS ───────────────────────
    const excerpts = (excerptsRes.data ?? []).map(item => ({
      id:       `excerpts-${item.id}`,
      title:    item.title,
      category: 'Excerpt',

      // IMPORTANT: correct route
      path:     `/excerpts`,

      subtitle: item.bookTitle ?? '',
    }))

    return [...books, ...excerpts]

  } catch (err) {
    console.error('Search failed:', err)
    return []
  }
}

// ─────────────────────────────────────────────
// MAIN HOOK
export function useSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const timerRef = useRef(null)
  const abortRef = useRef(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    abortRef.current = false

    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        const [staticResults, supabaseResults] = await Promise.all([
          searchStatic(trimmed),
          searchSupabase(trimmed),
        ])

        if (abortRef.current) return

        const seen = new Set()
        const merged = []

        for (const item of [...staticResults, ...supabaseResults]) {
          if (!seen.has(item.id)) {
            seen.add(item.id)
            merged.push(item)
          }

          if (merged.length >= MAX_RESULTS) break
        }

        setResults(merged)

      } catch (err) {
        if (!abortRef.current) {
          console.error(err)
          setError('Hindi ma-load ang mga resulta.')
        }
      } finally {
        if (!abortRef.current) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      abortRef.current = true
      clearTimeout(timerRef.current)
    }
  }, [query])

  return { results, loading, error }
} 
