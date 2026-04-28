// src/API/useAlgoliaSearch.js
// Lightweight Algolia search hook — replaces useSearch.js entirely.
// Uses only the Search-Only API key, safe to expose in the browser.

import { useState, useEffect, useRef } from 'react'
import { algoliasearch } from 'algoliasearch'

const client = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY
)

const INDEX_NAME      = 'panuri'
const DEBOUNCE_MS     = 250
const DEFAULT_RESULTS = 20   // raised from 10 — show more by default
const MIN_QUERY       = 1

// ── Snippet helper ────────────────────────────────────────────────────────────
// Algolia returns _snippetResult and _highlightResult objects per field.
// This picks the best available snippet to show under each result (like Google's
// gray preview line). Falls back gracefully if no snippet was matched.

function getBestSnippet(hit) {
  const s = hit._snippetResult

  // Prefer the field where Algolia actually found the match (matchLevel = 'full')
  const candidates = [
    s?.body,
    s?.paragraphs,
    s?.listContent,
    s?.headings,
    s?.subtitle,
    s?.description,
  ]

  for (const candidate of candidates) {
    if (candidate?.matchLevel === 'full' && candidate?.value) {
      return candidate.value  // already has <em> tags for highlighting
    }
  }

  // Fall back to any non-empty snippet
  for (const candidate of candidates) {
    if (candidate?.value) return candidate.value
  }

  // Last resort: plain subtitle
  return hit.subtitle ?? ''
}

// ── Highlighted title helper ──────────────────────────────────────────────────
// Returns the title with matched words wrapped in <em> by Algolia.

function getHighlightedTitle(hit) {
  return hit._highlightResult?.title?.value ?? hit.title
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSearch(query, { category, hitsPerPage = DEFAULT_RESULTS } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const timerRef = useRef(null)
  const abortRef = useRef(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY) {
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
        const { results: algoliaResults } = await client.search({
          requests: [
            {
              indexName:   INDEX_NAME,
              query:       trimmed,
              hitsPerPage,

              // ── Return snippet context around the matched word ──────────────
              // 30 words of context for body fields, 15 for shorter ones.
              attributesToSnippet: [
                'body:30',
                'paragraphs:25',
                'listContent:20',
                'headings:15',
                'subtitle:15',
                'description:20',
              ],
              snippetEllipsisText: '…',

              // ── Return highlighted title so matched words can be bolded ─────
              attributesToHighlight: ['title', 'subtitle', 'headings'],
              highlightPreTag:       '<mark>',   // use <mark> instead of <em>
              highlightPostTag:      '</mark>',  // so CSS is easier to style

              // ── Optional: filter by category (e.g. 'Pagsusuri', 'Quiz') ────
              ...(category ? { filters: `category:"${category}"` } : {}),
            },
          ],
        })

        if (abortRef.current) return

        const hits = algoliaResults?.[0]?.hits ?? []

        const mapped = hits.map(hit => ({
          id:               hit.objectID,
          title:            hit.title,
          titleHighlighted: getHighlightedTitle(hit),  // has <mark> tags
          subtitle:         hit.subtitle ?? '',
          snippet:          getBestSnippet(hit),        // has <mark> tags, shows WHERE match is
          category:         hit.category,
          path:             hit.path,
        }))

        setResults(mapped)

      } catch (err) {
        if (!abortRef.current) {
          console.error('Algolia search error:', err)
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
  }, [query, category, hitsPerPage])

  return { results, loading, error }
}