import { useState, useEffect, useCallback, useRef } from 'react';
import './MascotBubble.css';

// ─── Device / context helpers ─────────────────────────────────
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Magandang Umaga';
  if (hour < 18) return 'Magandang Hapon';
  return 'Magandang Gabi';
}

function getDeviceContext() {
  const ua       = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const device   = isTablet ? 'tablet' : isMobile ? 'mobile phone' : 'computer';

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const network    = connection ? `${connection.effectiveType ?? 'unknown'} connection` : 'unknown connection';

  const hour   = new Date().getHours();
  const isRush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const period = isRush ? 'during rush hour' : 'at a relaxed time of day';

  const lang = navigator.language || 'unknown';
  const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

  return { device, network, period, lang, tz };
}

function getUsageContext() {
  const lifetimeVisits = parseInt(localStorage.getItem('panuri_visits') || '0') + 1;
  localStorage.setItem('panuri_visits', lifetimeVisits);

  const sessionStart = sessionStorage.getItem('panuri_session_start');
  if (!sessionStart) sessionStorage.setItem('panuri_session_start', Date.now());
  const sessionMinutes = sessionStart
    ? Math.floor((Date.now() - parseInt(sessionStart)) / 60000)
    : 0;

  const lastVisit     = localStorage.getItem('panuri_last_visit');
  const daysSinceLast = lastVisit
    ? Math.floor((Date.now() - parseInt(lastVisit)) / 86400000)
    : null;
  localStorage.setItem('panuri_last_visit', Date.now());

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return { lifetimeVisits, sessionMinutes, daysSinceLast, prefersDark };
}

// ─── Prompt builder ───────────────────────────────────────────
function getModePrompt(mode, timeGreeting, device, usage) {
  const { lifetimeVisits, sessionMinutes, daysSinceLast, prefersDark } = usage;

  const isReturning   = lifetimeVisits > 1;
  const returnContext = daysSinceLast !== null
    ? daysSinceLast === 0
      ? 'bumalik ka muli ngayon'
      : daysSinceLast === 1
        ? 'bumalik ka pagkatapos ng isang araw'
        : `bumalik ka pagkatapos ng ${daysSinceLast} araw`
    : 'unang pagbisita mo ito';

  const basePersona = `Ikaw si PANURI (kilala rin bilang Hoot-Hoot), ang matalinong at mapagkaibigan na owl mascot ng Panuri Online — 
isang interactive Philippine literature analysis web app na may mga tampok tulad ng 
"Talahanayan" (Questionnaires), "Pagsusuri" (Literary Analysis), at 
"Mas Pinaunlad na Pamantayan" (Improved Standardized Criteria).
Ang kasalukuyang oras ay ${timeGreeting}. Ginagamit ng user ang isang ${device}.
${isReturning ? `Ito ay kanyang ${lifetimeVisits}th na pagbisita at ${returnContext}.` : 'Ito ay unang pagbisita ng user.'}
${sessionMinutes > 2 ? `Narito na siya sa loob ng ${sessionMinutes} minuto.` : ''}
${prefersDark ? 'Gusto niya ang dark mode — baka late night siya nag-aaral.' : ''}`;

  switch (mode) {
    case 'login':
      return `${basePersona}
Nasa Login page ang user. ${isReturning ? 'Maligayang pagbabalik!' : 'Bagong bisita ito!'}
Sumulat ng ISANG maikling pangungusap sa Tagalog na:
- Bumabati sa kanya gamit ang tamang ${timeGreeting}
- Nag-eencourage na mag-login
- Random na nagsasabi ng isang kawili-wiling bagay tungkol sa panitikang Pilipino o sa website
Huwag gumamit ng panipi. Maikli at conversational lang.`;

    case 'register':
      return `${basePersona}
Nasa Registration page ang user. Bagong miyembro ito!
Simulan ang mensahe sa: "Hi! Ako si Hoot-Hoot, ang iyong kaibigang katuwang sa pag-aaral ng Panunuring Pampanitikan!"
Pagkatapos, magdagdag ng ISANG maikling pangungusap sa Tagalog na:
- Gumagamit ng tamang ${timeGreeting}
- Masayang tinatanggap siya sa komunidad
- May kasamang isa o dalawang salita tungkol sa pagsusuri ng panitikan
Huwag gumamit ng panipi. Maikli at conversational lang.`;

    case 'forgot':
      return `${basePersona}
Nakalimutan ng user ang kanyang password at nasa Forgot Password page siya.
Sumulat ng ISANG maikling pangungusap sa Tagalog na:
- Nakakatawa o nakaka-relax tungkol sa pagkalimot ng password
- Nagtitiyak sa kanya na tutulong si PANURI
- Magaan at encouraging ang tono
Huwag gumamit ng panipi. Maikli at conversational lang.`;

    case 'reset':
      return `${basePersona}
Nasa Reset Password page ang user — papalapit na siya sa pagbawi ng access!
Sumulat ng ISANG maikling pangungusap sa Tagalog na:
- Papuri sa kanya dahil halos na-recover na niya ang account
- Encouraging at may konting humor
- Nagsasabing malapit na siyang makabalik sa pagsusuri ng panitikan
Huwag gumamit ng panipi. Maikli at conversational lang.`;

    default:
      return `${basePersona}
Sumulat ng ISANG maikling pangungusap sa Tagalog na bumabati sa user gamit ang ${timeGreeting}.
Huwag gumamit ng panipi. Maikli at conversational lang.`;
  }
}

function getFallback(mode) {
  const t = getTimeGreeting();
  switch (mode) {
    case 'login':    return `${t}! Mag-login upang magpatuloy sa iyong pagsusuri ng panitikan.`;
    case 'register': return `Hi! Ako si Hoot-Hoot, ang iyong kaibigang katuwang sa pag-aaral ng Panunuring Pampanitikan!`;
    case 'forgot':   return `${t}! Huwag mag-alala, normal lang ang makalimot — tulungan kita!`;
    case 'reset':    return `${t}! Kaunting hakbang na lang at mababawi mo na ang iyong account!`;
    default:         return `${t}! Mabuhay sa Panuri Online!`;
  }
}

// ─── Typewriter helper ────────────────────────────────────────
// Animates text word-by-word so the bubble feels like Hoot-Hoot is speaking live
function useTypewriter(fullText, speed = 60) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const timerRef                  = useRef(null);

  useEffect(() => {
    if (!fullText) return;
    setDisplayed('');
    setDone(false);

    const words = fullText.split(' ');
    let i = 0;

    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(timerRef.current);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [fullText, speed]);

  return { displayed, done };
}

// ─── Component ────────────────────────────────────────────────
export default function MascotBubble({ mode }) {
  const [fullGreeting, setFullGreeting] = useState('');
  const [loading, setLoading]           = useState(true);
  const [refreshKey, setRefresh]        = useState(0);
  const [isThinking, setIsThinking]     = useState(false);

  // Typewriter runs on the full AI response
  const { displayed, done } = useTypewriter(fullGreeting, 55);

  const fetchGreeting = useCallback(async () => {
    setLoading(true);
    setFullGreeting('');

    const cacheKey = `panuri_msg_${mode}_${refreshKey}`;
    const cached   = sessionStorage.getItem(cacheKey);
    if (cached) {
      setFullGreeting(cached);
      setLoading(false);
      return;
    }

    // Show "thinking" dots while waiting for Groq
    setIsThinking(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('No API key');

      const timeGreeting = getTimeGreeting();
      const { device }   = getDeviceContext();
      const usage        = getUsageContext();
      const prompt       = getModePrompt(mode, timeGreeting, device, usage);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 80,
        }),
      });

      const data    = await res.json();
      const message = data.choices?.[0]?.message?.content;
      if (!message) throw new Error('Invalid response');

      const cleaned = message.replace(/"/g, '').trim();
      sessionStorage.setItem(cacheKey, cleaned);
      setFullGreeting(cleaned);

    } catch (e) {
      console.error('Groq API error:', e);
      setFullGreeting(getFallback(mode));
    } finally {
      setIsThinking(false);
      setLoading(false);
    }
  }, [mode, refreshKey]);

  useEffect(() => {
    fetchGreeting();
  }, [fetchGreeting]);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => setRefresh(k => k + 1), 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mascot-bubble-container">
      <img
        src="/mascot.png"
        alt="Panuri Mascot"
        className={`auth-hero-mascot${isThinking ? ' mascot-thinking' : ''}`}
        onClick={() => setRefresh(k => k + 1)}
        style={{ cursor: 'pointer' }}
        title="I-click para sa bagong mensahe!"
      />
      <div className={`mascot-speech-bubble${isThinking ? ' bubble-pulse' : ''}`}>
        <h4 className="mascot-bubble-name">Hoot-hoot</h4>
        <p className="mascot-bubble-text">
          {loading || isThinking ? (
            <span className="mascot-typing">
              Nag-iisip<span>.</span><span>.</span><span>.</span>
            </span>
          ) : (
            <>
              {displayed}
              {/* blinking cursor while typewriter is still running */}
              {!done && <span className="mascot-cursor">|</span>}
            </>
          )}
        </p>
      </div>
    </div>
  );
} 