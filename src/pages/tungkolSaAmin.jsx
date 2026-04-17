import { useEffect, useState } from 'react';
import './tungkolSaAmin.css'

const METO_CARDS = [
  { title: 'Talahanungan', icon: '📋' },
  { title: 'Pagsusuri', icon: '🔍' },
  { title: 'Pagwawangis\nng PANURI', icon: '📊' },
]

const TEAM_MEMBERS = [
  {
    name: 'EDWIN R. ICHIANO PHD',
    role: 'Tagapayo',
    email: '',
    img: '/edwin.png',
    imgStyle: { objectFit: 'contain', transform: 'scale(1.8)', objectPosition: 'center center' }
  },
  {
    name: 'RYAN S. RODRIGUEZ, PHD',
    role: 'Riserts Propesor',
    email: '',
    img: '/ryan.png'
  },
  {
    name: 'John Rey G. Trapalgar',
    role: 'May-Akda',
    email: 'sirtrapssy@gmail.com',
    img: '/johnrey.png'
  },
  {
    name: 'Neziel D. Alvarez',
    role: 'May-Akda',
    email: 'zyriel.alvarez@gmail.com',
    img: '/neziel.png'
  }
]

export default function TungkolSaAmin() {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="tsa-root">
      <div className="tsa-bg" aria-hidden="true">
        <div className="tsa-bg-grid" style={{ transform: `translateY(${offsetY * 0.5}px)` }} />
        <div className="tsa-bg-glow tsa-bg-glow--1" style={{ transform: `translateY(${offsetY * 0.85}px)` }} />
        <div className="tsa-bg-glow tsa-bg-glow--2" style={{ transform: `translateY(${offsetY * 0.75}px)` }} />
      </div>

      <div className="tsa-container">

        {/* ── Hero Title ── */}
        <header className="tsa-hero">
          <h1 className="tsa-hero-title">Tungkol Sa Amin</h1>
        </header>

        {/* ── INTRODUKSYON ── */}
        <section className="tsa-section">
          <div className="tsa-section-tag tsa-tag--red">INTRODUKSYON</div>
          <div className="tsa-intro-grid">
            <div className="tsa-intro-body">
              <p>
                Ang pagsusuri ay hindi lamang isang akademikong gawain kundi isang mahalagang kasanayan na humuhubog sa kritikal na pag-iisip, pag-unawa sa konteksto, at pag-uugnay ng panitikan sa tunay na karanasan ng tao at lipunan. Ayon sa Seksyon 1 ng CMO Memorandum Order (CMO) Blg. 21, s. 2017, na tumatalakay sa "Bachelor of Arts in Literature", malinaw na itinakda ng CHED ang inaasahang kaalaman at kasanayan ng mga mag-aaral, kabilang ang kakayahan sa pagsusuri at pagpapakahulugan ng akdang pampanitikan.
              </p>
            </div>

          </div>
        </section>

        {/* ── LAYUNIN ── */}
        <section className="tsa-section tsa-section--center">
          <div className="tsa-section-tag tsa-tag--white">LAYUNIN</div>
          <div className="tsa-layunin-card">
            <p>
              Layunin ng pananaliksik na <mark className="tsa-highlight">makabuo ng isang istandard na pamantayan at kagamitang pantulong sa pagsusuri</mark> ng mga akdang pampanitikan upang mapaunlad ang kasanayan ng mga mag-aaral sa Filipino sa asignaturang Panunuring Pampanitikan.
            </p>
          </div>
        </section>

        {/* ── METODOLOHIYA ── */}
        <section className="tsa-section">
          <div className="tsa-section-tag tsa-tag--white">METODOLOHIYA</div>
          <div className="tsa-meto-grid">
            {METO_CARDS.map((m, i) => (
              <div className={`tsa-meto-card tsa-meto-card--${i}`} key={m.title}>
                <span className="tsa-meto-icon">{m.icon}</span>
                <p className="tsa-meto-title">{m.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mga Natuklasan ── */}
        <section className="tsa-section tsa-section--center">
          <div className="tsa-lava-box">
            <h2 className="tsa-lava-title">Mga Natuklasan</h2>
            <div className="tsa-glass-card">
              <p>
                Walang Istandard na Pamantayan sa Pagsusuri ng mga Akdang Pampanitikan sa asignaturang Panunuring Pampanitikan Mahuhusay na sa Larangan ng Pagsusuri ang mga mag-aaral na nagsipagtapos sa asignaturang Panunuring Pampanitikan ngunit may mga mungkahi parin silang nais maipaunlad para sa ikakaunlad pa ng kanilang kasanayan at para sa mga susunod pang mag-aaral na kukuha ng asignaturang panunuring pampanitikan.
              </p>
            </div>
          </div>
        </section>

        {/* ── TUGON: PANURI ── */}
        <section className="tsa-section">
          <div className="tsa-section-tag tsa-tag--red">TUGON: PANURI</div>
          <div className="tsa-tugon-grid">
            <div className="tsa-tugon-body">
              <p>
                PANURII. Isang interaktibong kagamitang pantulong na gamit ang teknolohiya o website na naglalaman ng mga interbensyon upang mapaunlad ang kasanayan sa pagsusuri ng mga akdang pampanitikan sa asignaturang Panunuring Pampanitikan. Ngalalaman din ito ng Mas Pinaunlasd at Binagong Pamantayan sa pagsusuri upang tumugon sa kawalan ng isang istandardisadong pamapantayan sa pagsusuri ng mga akda.
              </p>
            </div>
            <div className="tsa-tugon-logo">
              <div className="tsa-tugon-logo-box">
                <img src="/mascot.png" alt="Panuri Logo" />
              </div>
            </div>
          </div>
        </section>

        {/* ── TEAM & QUOTE ── */}
        <section className="tsa-section">
          <div className="tsa-team-grid">
            {TEAM_MEMBERS.map((member) => (
              <div className="tsa-team-card" key={member.name}>
                <div className="tsa-team-img-wrapper">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="tsa-team-img"
                    style={member.imgStyle || {}}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <div className="tsa-team-info">
                  <h4 className="tsa-team-name">{member.name}</h4>
                  <p className="tsa-team-role">{member.role}</p>
                  {member.email && <p className="tsa-team-email">{member.email}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="tsa-quote-container">
            <p className="tsa-quote">
              "Ang pagsusuri ay parang pagsusulat ng sariling akda, ito ay pagbibigay ng sarili mong interpretasyon sa mga bagay sa iyong paligid."
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
