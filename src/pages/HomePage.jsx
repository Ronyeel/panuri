import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'
import localBooks from '../data/books.json'
import { supabase } from '../API/supabase'
import { useBookPalette } from '../hooks/useBookPalette'

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERVAL = 6000

const PAMANTAYAN_CARDS = [
  { id: 0, numeral: 'I',    title: 'Panimulang Impormasyon', items: ['Titulo ng Akda', 'May-akda / Direktor / Tagasalin', 'Maikling Talambuhay (may larawan kung mayroon) ng May-Akda', 'Sanggunian'] },
  { id: 1, numeral: 'II',   title: 'Pag-unawa sa Akda', items: ['Paksa', 'Tema', 'Layunin', 'Layunin sa loob ng akda', 'Layunin ng awtor', 'Layunin sa Manunulat', 'Mga Tauhan', 'Mga Suliranin', 'Kasukdulan', 'Paghawan ng Sagabal', 'Kakalasan', 'Paglalahat'] },
  { id: 2, numeral: 'III',  title: 'Pagsusuring Pampanitikan (Tekstwal)', items: ['Istilo ng Pagsulat ng Awtor', 'Kayarian ng Akda (Baliktad na Piramide, Kronolohikal na Ayos, atbp.)', 'Mga Tayutay', 'Mga Simbolismo', 'Integrasyong Pangbalyus / Values Integration (Mga Aral na Mapupulot sa Akda)'] },
  { id: 3, numeral: 'IV',   title: 'Pagsusuring Kontekstwal', items: ['Teoryang Pampanitikan (Mga teoryang ginamit sa akda)', 'Indibidwal at Kalagayang Sosyal', 'Kulturang Namamayani', 'Paniniwala at Tradisyon sa Loob ng Akda'] },
  { id: 4, numeral: 'V',    title: 'Makabagong Perspektibo', items: ['Kaugnayan sa Kasalukuyang Panahon (hal. social media, global issues)', 'Pagtingin batay sa iba’t ibang lente (hal. gender, kabataan, identidad)'] },
  { id: 5, numeral: 'VI',   title: 'Personal na Pagsusuri', items: ['Repleksyon (sariling opinyon patungkol sa akda)', 'Komento, Suhestiyon at Rekomendasyon'] },
  { id: 6, numeral: 'VII',  title: 'Bisa ng Akda', items: ['Bisa sa Isip o Kognitibong Aspekto', 'Bisa sa Pag-uugali / Damdamin', 'Bisa sa Kasanayang Panunuri'] },
  { id: 7, numeral: 'VIII', title: '', items: [] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomNext(current, length) {
  if (length <= 1) return 0
  let next
  do { next = Math.floor(Math.random() * length) } while (next === current)
  return next
}

function getTitleLen(title) {
  const len = title.length
  if (len < 12) return 'short'
  if (len < 24) return 'medium'
  if (len < 40) return 'long'
  return 'xlong'
}

function getLongestWordLen(title) {
  return Math.max(...title.split(' ').map(w => w.length))
}

function pairWords(title) {
  const words = title.split(' ')
  if (words.length === 2) {
    return [words[0], words[1]]
  }
  const pairs = []
  for (let i = 0; i < words.length; i += 2) {
    pairs.push(words.slice(i, i + 2).join(' '))
  }
  return pairs
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   isLoggedIn {boolean} — passed down from App so we don't need a second
 *                          onAuthStateChanged listener here (single source of truth)
 *   username   {string}  — display name or email from the authenticated user
 */
export default function HomePage({ isLoggedIn = false, username = 'Bisita' }) {
  const bgRef       = useRef(null)
  const bannerRef   = useRef(null)
  const navigate    = useNavigate()
  const [activeCard, setActiveCard] = useState(null)
  const [selectedModalCard, setSelectedModalCard] = useState(null)
  const [showRubrics, setShowRubrics] = useState(false)

  const [books, setBooks] = useState(localBooks)
  const [index, setIndex] = useState(() => Math.floor(Math.random() * localBooks.length))
  const [phase, setPhase] = useState('idle')

  const book        = books[index] ?? books[0]
  const { r, g, b } = useBookPalette(book.cover)

  // ── Fetch Supabase books and merge with local ─────────────────
  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('year', { ascending: true })

      if (!error && data?.length > 0) {
        const supabaseIds = new Set(data.map(b => b.id))
        const localOnly   = localBooks.filter(b => !supabaseIds.has(b.id))
        setBooks([...data, ...localOnly])
      }
    }
    fetchBooks()
  }, [])

  // ── Auto-feature random book every INTERVAL ms ────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase('exit')
      setTimeout(() => {
        setIndex(i => randomNext(i, books.length))
        setPhase('enter')
        setTimeout(() => setPhase('idle'), 50)
      }, 400)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [books.length])

  // ── Parallax on school banner ─────────────────────────────────
  useEffect(() => {
    const bg     = bgRef.current
    const banner = bannerRef.current
    if (!bg || !banner) return

    let current = 0
    let target  = 0
    let rafId   = null

    const lerp = (a, b, t) => a + (b - a) * t

    const getTarget = () => {
      const rect     = banner.getBoundingClientRect()
      const viewH    = window.innerHeight
      const bannerH  = rect.height
      const progress = (viewH - rect.top) / (viewH + bannerH)
      return (progress - 0.5) * bannerH * 0.45
    }

    const tick = () => {
      current = lerp(current, target, 0.06)
      if (Math.abs(current - target) > 0.05) {
        bg.style.transform = `translateY(${current.toFixed(2)}px)`
        rafId = requestAnimationFrame(tick)
      } else {
        bg.style.transform = `translateY(${target.toFixed(2)}px)`
        rafId = null
      }
    }

    const onScroll = () => {
      target = getTarget()
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    target = current = getTarget()
    bg.style.transform = `translateY(${current.toFixed(2)}px)`

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // ── Derived state ─────────────────────────────────────────────

  const panelClass = phase === 'exit'  ? 'panel--exit'
                   : phase === 'enter' ? 'panel--enter'
                   : ''

  const bookClass = [
    'book-stage',
    phase === 'exit'  ? 'book--exit' : '',
    phase === 'enter' ? 'book--enter' : '',
  ].filter(Boolean).join(' ')

  const titleLen      = getTitleLen(book.title)
  const longestWord   = getLongestWordLen(book.title)
  const titlePairs    = pairWords(book.title)
  const hasPdf        = Boolean(book.pdf)

  const goToBook = () => {
    if (!hasPdf) return
    // RequireAuth in App.jsx guards this route — no need to check isLoggedIn here,
    // but we keep it for an immediate UX response before the route redirect fires.
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    navigate(`/libro/${book.id}`)
  }

  const goToExcerpt = () =>
    navigate(`/excerpts?book=${encodeURIComponent(book.title)}&read=1`)

  return (
    <>
    <main className="homepage">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero" id="home">

        <div
          className="hero-color-wash"
          style={{
            background: `radial-gradient(ellipse 100% 80% at 50% 120%, rgba(${r},${g},${b},0.5) 0%, rgba(${r},${g},${b},0.2) 45%, transparent 70%)`
          }}
        />

        <div className="hero-bg-texture" aria-hidden="true" />

        <div className="hero-inner">

          <div className="hero-welcome-tag">
            <span className="welcome-label">Maligayang Pagdating</span>
            <span className="welcome-name">{username}</span>
            <span className="welcome-bang">!</span>
          </div>

          <div className="hero-showcase">

            {/* LEFT — title + author */}
            <div className={`hero-left ${panelClass}`}>
              <p className="hero-featured-label">Tampok na Aklat</p>

              <h1
                className="hero-book-title"
                data-len={titleLen}
                onClick={goToBook}
                style={{ 
                  cursor: hasPdf ? 'pointer' : 'default',
                  '--longest-word': longestWord 
                }}
              >
                {titlePairs.map((line, i) => (
                  <span
                    key={line + i}
                    className={`title-word ${i % 2 === 0 ? 'title-word--red' : 'title-word--white'}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {line}
                  </span>
                ))}
              </h1>

              <div className="hero-author-row">
                <span className="hero-author-by">ni</span>
                <span className="hero-author-name">{book.author}</span>
              </div>
            </div>

            {/* CENTER — book cover */}
            <div className="hero-center">
              <div className="book-stage-wrap">
                <div
                  className={bookClass}
                  onClick={goToBook}
                  style={{ cursor: hasPdf ? 'pointer' : 'default' }}
                >
                  <div className="book-shadow" />
                  <div className="book-cover">
                    <img src={book.cover} alt={`${book.title} cover`} />
                    <div className="book-sheen" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — quote + CTA */}
            <div className={`hero-right ${panelClass}`}>
              <span className="quote-opener">&ldquo;</span>
              <blockquote className="hero-quote">{book.quote}</blockquote>

              <div className="hero-cta-group">
                <button
                  className="hero-cta"
                  onClick={goToBook}
                  disabled={!hasPdf}
                  style={{
                    opacity: hasPdf ? 1 : 0.4,
                    cursor:  hasPdf ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>{hasPdf ? 'Basahin' : 'Wala pang PDF'}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="hero-cta-excerpt" onClick={goToExcerpt}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h10M4 18h12" />
                  </svg>
                  <span>Basahin ang Excerpt</span>
                </button>
              </div>
            </div>

          </div>

          <div className="hero-rule" aria-hidden="true">
            <span /><span className="rule-diamond" /><span />
          </div>

        </div>
      </section>

      {/* ── School Photo Banner ────────────────────────────────── */}
      <section
        className="school-banner"
        ref={bannerRef}
        role="img"
        aria-label="Camarines Norte State College"
      >
        <div
          className="school-banner__bg"
          ref={bgRef}
          style={{ backgroundImage: 'url(/cnsc.jpg)' }}
        />
        <div className="school-overlay" />
        <div className="school-banner__content">
          <h2 className="school-headline">
            Magsulat. Magbasa. Magsuri. <br />
            <em>
              Patungo sa Holistikong Kasanayan <br />
              at Kaalamang Panunuri.
            </em>
          </h2>
        </div>
      </section>

      {/* ── CTA Strip ─────────────────────────────────────────── */}
      <section className="cta-strip">
        <div className="cta-deco-circle cta-deco--1" aria-hidden="true" />
        <div className="cta-deco-circle cta-deco--2" aria-hidden="true" />
        <div className="cta-inner">
          <p className="cta-eyebrow">Para sa mga Manunulat at Mambabasa</p>
          <button className="cta-btn" onClick={() => navigate('/excerpts')}>
            Basahin ang mga Excerpts
          </button>
        </div>
      </section>

      {/* ── Pamantayan Cards ────────────────────────────────── */}
      <section className="hp-cards-section">
        <div className="hp-cards-inner">
          <p className="hp-cards-intro-text">
            Narito ang pamantayang sinuri, pinag-aralan at mabusising binuo upang matugunan ang mga pangangailangan sa makabagong panahon:
          </p>
          <div className="hp-cards-eyebrow">
            <span className="hp-cards-line" />
            <span className="hp-cards-label">Mga Pamantayan sa Pagsusuri</span>
            <span className="hp-cards-line" />
          </div>
          <div className="hp-cards-grid">
            {PAMANTAYAN_CARDS.map((card) => {
              const isActive = activeCard === card.id
              return (
                <div
                  key={card.id}
                  className={`hp-card${isActive ? ' hp-card--active' : ''}`}
                  onClick={() => {
                    setActiveCard(isActive ? null : card.id)
                    if (card.title) setSelectedModalCard(card)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveCard(isActive ? null : card.id)
                      if (card.title) setSelectedModalCard(card)
                    }
                  }}
                >
                  <span className="hp-card-numeral">{card.numeral}.</span>
                  <p className="hp-card-title">{card.title || '—'}</p>
                  <div className="hp-card-footer">
                    <span className="hp-card-link">Basahin</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hp-cards-closing">
            <p>
              Ang pamantayang ito ay nahahati sa iba't ibang bahagi, mula sa panimulang impormasyon
              at pag-unawa sa akda, hanggang sa masusing tekstwal at kontekstwal na pagsusuri,
              paglalapat ng makabagong perspektibo, personal na repleksyon, at pagtukoy sa bisang
              pampanitikan. Sa ganitong paraan, nagiging mas malinaw ang daloy ng pagsusuri at
              napapalalim ang interpretasyon ng isang akda.
            </p>
            <p>
              Higit sa lahat, ang bagong pamantayang ito ay hindi lamang nakatuon sa akademikong
              pag-aaral, kundi sa paghubog ng isang mapanuri, kritikal, at responsableng mambabasa.
              Sa pamamagitan ng sistematikong gabay na ito, inaasahang ang mga mag-aaral ay
              magkakaroon ng kakayahang hindi lamang umunawa ng panitikan, kundi magbigay rin ng
              makabuluhan at makatuwirang pagsusuri na may kaugnayan sa kanilang sariling karanasan
              at sa mas malawak na lipunan.
            </p>

            <div className="hp-table-container">
              <p className="hp-table-title">
                Pamantayan sa Pagmamarka na ibinatay sa LRMDS Educational Evaluation Framework at sa Pamantayan ni Prof. Ryan S. Rodriguez
              </p>
              <div className="hp-table-meta">
                <span>Kabuuang Puntos: 100</span>
                <span>Iskala ng Pagmamarka</span>
              </div>
              <table className="hp-marking-table">
                <thead>
                  <tr>
                    <th>Marka</th>
                    <th>Deskripsyon</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>4</td>
                    <td>Napakahusay</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Mahusay</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Katamtaman</td>
                  </tr>
                  <tr>
                    <td>1</td>
                    <td>Nangangailangan ng Pagpapabuti</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold">
                <strong>A. Kalidad ng Nilalaman</strong> – 20 puntos
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-rubric-table">
                  <thead>
                    <tr>
                      <th>PAMANTAYAN</th>
                      <th className="hp-center-col">4</th>
                      <th className="hp-center-col">3</th>
                      <th className="hp-center-col">2</th>
                      <th className="hp-center-col">1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PAGKILALA SA AKDA (PAMAGAT, MAY-AKDA, SANGGUNIAN)</strong></td>
                      <td>Kumpleto at akademiko ang pagkakalahad.</td>
                      <td>Kumpleto ngunit may kaunting kakulangan.</td>
                      <td>May kulang na impormasyon.</td>
                      <td>Hindi malinaw o mali ang datos.</td>
                    </tr>
                    <tr>
                      <td><strong>BUOD NG AKDA</strong></td>
                      <td>Malinaw, lohikal, at kumakatawan sa kabuuang akda.</td>
                      <td>Maayos ngunit may kulang na detalye.</td>
                      <td>May kalituhan sa daloy.</td>
                      <td>Hindi malinaw ang buod.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGKILALA SA URI NG PANITIKAN</strong></td>
                      <td>Malalim at may matibay na paliwanag.</td>
                      <td>May malinaw na paliwanag.</td>
                      <td>Limitado ang paliwanag.</td>
                      <td>Mali ang pagtukoy.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGKILALA SA MGA TAYUTAY AT ESTETIKONG ELEMENTO</strong></td>
                      <td>Maraming halimbawa at mahusay ang paliwanag.</td>
                      <td>May sapat na halimbawa.</td>
                      <td>Iilang halimbawa lamang.</td>
                      <td>Walang malinaw na halimbawa.</td>
                    </tr>
                    <tr>
                      <td><strong>KAUGNAY SA KONTEKSTO NG AKDA (PANLIPUNAN / KULTURAL)</strong></td>
                      <td>Malinaw ang ugnayan ng akda sa realidad o lipunan.</td>
                      <td>May bahagyang ugnayan.</td>
                      <td>Limitado ang koneksyon.</td>
                      <td>Walang malinaw na koneksyon.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold">
                <strong>B. Kritikal na Pagsusuri</strong> – 20 puntos
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-rubric-table">
                  <thead>
                    <tr>
                      <th>PAMANTAYAN</th>
                      <th className="hp-center-col">4</th>
                      <th className="hp-center-col">3</th>
                      <th className="hp-center-col">2</th>
                      <th className="hp-center-col">1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PAGLALAPAT NG TEORYANG PAMPANITIKAN</strong></td>
                      <td>Malalim at kritikal ang paggamit ng teorya.</td>
                      <td>May malinaw na paglalapat.</td>
                      <td>Bahagyang nailapat.</td>
                      <td>Walang inilapat na teorya.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGSUSURI SA ISTILO NG PAGLALAHAD</strong></td>
                      <td>Malalim ang interpretasyon sa teknik ng akda.</td>
                      <td>May malinaw na paliwanag.</td>
                      <td>Limitado ang pagsusuri.</td>
                      <td>Hindi malinaw ang pagsusuri.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGSUSURI SA TAUHAN</strong></td>
                      <td>Kritikal at analitikal ang pagtalakay.</td>
                      <td>May sapat na pagsusuri.</td>
                      <td>Limitado ang paliwanag.</td>
                      <td>Halos walang pagsusuri.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGSUSURI SA BANGHAY O GALAW NG PANGYAYARI</strong></td>
                      <td>Lohikal at kritikal ang analisis.</td>
                      <td>May malinaw na paliwanag.</td>
                      <td>Limitado ang pagsusuri.</td>
                      <td>Walang malinaw na pagsusuri.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGGAMIT NG MGA EBIDENSYA MULA SA MGA SIPI NG AKDA AT TAMANG DATOS</strong></td>
                      <td>Wasto, may sapat na sipi at maayos ang integrasyon.</td>
                      <td>May sapat na sipi ngunit kakulangan sa paliwanag.</td>
                      <td>Limitado ang mga ebidensya at mga datos patungkol dito.</td>
                      <td>Walang sapat na ebidensya.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold">
                <strong>C. Organisasyon at Presentasyon</strong> – 12 puntos
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-rubric-table">
                  <thead>
                    <tr>
                      <th>PAMANTAYAN</th>
                      <th className="hp-center-col">4</th>
                      <th className="hp-center-col">3</th>
                      <th className="hp-center-col">2</th>
                      <th className="hp-center-col">1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>ORGANISASYON NG PAPEL (PANIMULAS, KATAWAN, KONKLUSYON)</strong></td>
                      <td>Napakaayos ng daloy ng ideya.</td>
                      <td>Maayos ngunit may kaunting kahinaan.</td>
                      <td>May kalituhan sa daloy.</td>
                      <td>Magulo ang organisasyon.</td>
                    </tr>
                    <tr>
                      <td><strong>LOHIKAL NA DALOY NG IDEYA</strong></td>
                      <td>Lohikal at malinaw ang argumentasyon.</td>
                      <td>Bahagyang lohikal ngunit may kakulangan.</td>
                      <td>Limitado ang lohika.</td>
                      <td>Walang malinaw na daloy ng argumento.</td>
                    </tr>
                    <tr>
                      <td><strong>AKADEMIKONG WIKA AT KALINAWAN NG PAGPAPAHAYAG</strong></td>
                      <td>Malinaw, pormal, at akademiko ang wika.</td>
                      <td>May kaunting kamalian ngunit malinaw pa rin.</td>
                      <td>May ilang kamalian at bahagyang malabo.</td>
                      <td>Maraming mali at mahirap unawain.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold">
                <strong>D. Mekaniks at Citation</strong> – 12 puntos
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-rubric-table">
                  <thead>
                    <tr>
                      <th>PAMANTAYAN</th>
                      <th className="hp-center-col">4</th>
                      <th className="hp-center-col">3</th>
                      <th className="hp-center-col">2</th>
                      <th className="hp-center-col">1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>TAMANG GRAMATIKA AT BAYBAY</strong></td>
                      <td>Tama ang mga gramatika at pagbaybay sa mga salita.</td>
                      <td>May kaunting mali sa mga gramatika at pagbaybay sa mga salita.</td>
                      <td>Maraming mali sa mga gramatika at pagbaybay sa mga salita.</td>
                      <td>Lubhang maraming mali sa mga gramatika at pagbaybay sa mga salita.</td>
                    </tr>
                    <tr>
                      <td><strong>PAGGAMIT NG CITATION</strong></td>
                      <td>Wasto at kumpleto.</td>
                      <td>May kaunting kakulangan.</td>
                      <td>Maraming kakulangan.</td>
                      <td>Walang wastong <em>citation</em>.</td>
                    </tr>
                    <tr>
                      <td><strong>PORMAT NG PAPEL</strong></td>
                      <td>Eksakto at propesyonal.</td>
                      <td>May kaunting mali sa pormat.</td>
                      <td>May ilang mali at binago sa pormat.</td>
                      <td>Hindi sumusunod sa pamantayan.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold" style={{ marginBottom: '12px' }}>
                <strong>Kabuuang Pagmamarka</strong>
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-summary-table">
                  <thead>
                    <tr>
                      <th>ANTAS NG PAGMAMARKA</th>
                      <th className="hp-center-col">PUNTOS</th>
                      <th className="hp-center-col">ISKOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>KALIDAD NG NILALAMAN</strong></td>
                      <td className="hp-center-col"><strong>20</strong></td>
                      <td className="hp-center-col" style={{ color: '#8a8270' }}>_______</td>
                    </tr>
                    <tr>
                      <td><strong>KRITIKAL NA PAGSUSURI</strong></td>
                      <td className="hp-center-col"><strong>20</strong></td>
                      <td className="hp-center-col" style={{ color: '#8a8270' }}>_______</td>
                    </tr>
                    <tr>
                      <td><strong>ORGANISASYON AT PRESENTASYON</strong></td>
                      <td className="hp-center-col"><strong>12</strong></td>
                      <td className="hp-center-col" style={{ color: '#8a8270' }}>_______</td>
                    </tr>
                    <tr>
                      <td><strong>MEKANIKS AT CITATION</strong></td>
                      <td className="hp-center-col"><strong>12</strong></td>
                      <td className="hp-center-col" style={{ color: '#8a8270' }}>_______</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hp-table-container hp-table-rubric-container">
              <p className="hp-table-title hp-table-title--bold" style={{ marginBottom: '12px' }}>
                <strong>Interpretasyon ng Pagmamarka</strong>
              </p>
              <div className="hp-table-wrapper">
                <table className="hp-marking-table hp-interpret-table">
                  <thead>
                    <tr>
                      <th className="hp-center-col">Iskor</th>
                      <th className="hp-center-col">Katumbas na Marka</th>
                      <th>Antas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="hp-center-col"><strong>60 - 64</strong></td>
                      <td className="hp-center-col">100</td>
                      <td><strong>Napakahusay</strong></td>
                    </tr>
                    <tr>
                      <td className="hp-center-col"><strong>54 – 59</strong></td>
                      <td className="hp-center-col">90</td>
                      <td><strong>Mahusay</strong></td>
                    </tr>
                    <tr>
                      <td className="hp-center-col"><strong>48 – 53</strong></td>
                      <td className="hp-center-col">85</td>
                      <td><strong>Katanggap-tanggap</strong></td>
                    </tr>
                    <tr>
                      <td className="hp-center-col"><strong>42 – 47</strong></td>
                      <td className="hp-center-col">80</td>
                      <td><strong>Katamtaman</strong></td>
                    </tr>
                    <tr>
                      <td className="hp-center-col"><strong>40 pababa</strong></td>
                      <td className="hp-center-col">75</td>
                      <td><strong>Nangangailangan ng Pagpapabuti</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {selectedModalCard && (
        <div className="hp-modal-backdrop" onClick={() => setSelectedModalCard(null)}>
          <div className="hp-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="hp-modal-close" onClick={() => setSelectedModalCard(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
            <div className="hp-modal-header">
              <span className="hp-modal-numeral">{selectedModalCard.numeral}.</span>
              <h3 className="hp-modal-title">{selectedModalCard.title}</h3>
            </div>
            <div className="hp-modal-body">
              <ul className="hp-modal-list">
                {selectedModalCard.items && selectedModalCard.items.map((item, idx) => (
                  <li key={idx}>
                    <span className="hp-modal-bullet"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}