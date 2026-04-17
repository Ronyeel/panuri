import React, { useState, useEffect, useRef } from 'react';
import './Pagsusuri.css';
import LAYUNIN from '../data/layunin.json';
import HAKBANG from '../data/hakbang.json';

const LEVELS = [
  {
    id: 'pag-unawa',
    letter: 'P',
    heading: 'Pag-unawa',
    text: `Ito ang unang hakbang sa pagsusuri kung saan inuunawa ang kabuuang ideya ng teksto o paksa. Mahalaga ang malinaw na pag-unawa upang magkaroon ng matibay na pundasyon sa susunod na hakbang. Hindi maaaring magsuri ang isang indibidwal kung hindi lubos na nauunawaan ang binabasa o pinag-aaralan. Dito nagsisimula ang mas malalim na pag-iisip at ito rin ang susi upang maiwasan ang maling interpretasyon.`,
  },
  {
    id: 'analisis',
    letter: 'A',
    heading: 'Analisis',
    text: `Sa bahaging ito, tinutulak tayo sa isang malalim na pag-aaral ng bawat nilalaman. Binibigyang-diin ang detalye, impormasyon, at ugnayin ng mga ideya. Dito malalaman ng mag-aaral ang mga mahalagang kaalaman. Ang bawat pagtanggap ng mag-aaral sa kaalaman ay may katumbas na pag-aaral na pagpapalago.`,
  },
  {
    id: 'gabay-ng-ebidensya',
    letter: 'G',
    heading: 'Gabay ng Ebidensya',
    text: `Sa bahaging ito, tinutulungan ang mag-aaral na mahanap at makilala ang mga ebidensya at ugnayin ng mga ideya. Dito malalaman ng mag-aaral ang mga mahalagang kaalaman na magiging batayan ng kanilang mga pagsusuri at mas malalim na pag-unawa sa paksa.`,
  },
  {
    id: 'sintesis',
    letter: 'S',
    heading: 'Sintesis',
    text: `Matuto sarin ang mga huling pinagsama-samang mga ideya upang maisang-isip ang kabuuan. Sa pamamagitan ng sintesis, ang mga mag-aaral ay magiging handa sa mas mataas na antas ng pag-iisip. Ang layunin ng sintesis ay ang pagpapalago ng kaalaman na may sapat at wastong pagpapaliwanag sa alinmang sitwasyon.`,
  },
  {
    id: 'ugnayan',
    letter: 'U',
    heading: 'Ugnayan',
    text: `Tinatasa ang mga koneksyon ng bawat mag-aaral at inuugnay ang pag-aaral sa totoong buhay. Ang layunin ng bahaging ito ay upang malaman ng mga mag-aaral ang kahalagahan ng kanilang mga natutuhan sa araw-araw na pamumuhay at pag-unlad ng lipunan.`,
  },
  {
    id: 'sariling-pananaw',
    letter: 'S',
    heading: 'Sariling Pananaw',
    text: `Sa bahaging ito, hinihikayat ang mag-aaral na magpahayag ng kanilang mga saloobin at pananaw. Mahalaga ang bahaging ito na makamit ang mataas na antas ng pag-iisip sa pamamagitan ng paglikha ng sariling pananaw at kahulugan.`,
  },
  {
    id: 'unawang-malalim',
    letter: 'U',
    heading: 'Unawang Malalim',
    text: `Ang pag-unawa sa ikatlong antas ng pagsusuri ay nagbibigay-daan sa mag-aaral na ipakita ang mataas na antas ng pag-iisip. Dito nagbibigay ng malalim na kahulugan at interpretasyon ang mga mag-aaral sa lahat ng napag-aralan nila sa nakaraang mga aralin at karanasan.`,
  },
  {
    id: 'repleksyon',
    letter: 'R',
    heading: 'Repleksyon',
    text: `Ang repleksyon ay nagpapalalim ng pag-aaral, dito sinisiyasat ng mag-aaral ang kanilang sariling pag-unlad. Nagtutulak ito sa mag-aaral na suriin ang kanilang mga proseso ng pag-iisip at pag-aaral upang mapabuti ang kanilang kakayahan sa hinaharap.`,
  },
  {
    id: 'integrasyon',
    letter: 'I',
    heading: 'Integrasyon',
    text: `Sa huling hakbang, isinasama ang lahat ng mga pag-aaral sa isang maayos na kabuuan. Ang integrasyon ay nagbibigay ng pagkakataon sa mga mag-aaral na ikonekta ang lahat ng kanilang natutuhan sa isang mas malawak na konteksto ng kaalaman, pag-unlad, at pagtanggap ng bagong kaalaman.`,
  },
];


export default function Pagsusuri() {
  const [activeStep, setActiveStep] = useState(null);

  const [showDesc, setShowDesc] = useState(false);

  // For scroll animation of timeline steps
  const [visibleSteps, setVisibleSteps] = useState([]);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const stepNum = parseInt(entry.target.dataset.step, 10);
        if (entry.isIntersecting) {
          setVisibleSteps((prev) => {
            if (!prev.includes(stepNum)) return [...prev, stepNum];
            return prev;
          });
        } else {
          setVisibleSteps((prev) => prev.filter((num) => num !== stepNum));
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -100px 0px' });

    const items = document.querySelectorAll('.hakbang-item');
    items.forEach((item) => observerRef.current.observe(item));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const handleStepClick = (number) => {
    setActiveStep(prev => prev === number ? null : number);
  };

  return (
    <div className="pagsusuri-page">

      {/* ── Hero ── */}
      <header className="pagsusuri-hero">
        <p className="hero-eyebrow">Pagsusuri</p>
        <h1 className="hero-title">
          Ano ba ang Pagsusuri para sa isang katulad kong Mapaghamong Mag-aaral?
        </h1>
        {/* Toggle button */}
        <button
          className={`hero-desc-toggle${showDesc ? ' hero-desc-toggle--open' : ''}`}
          onClick={() => setShowDesc(v => !v)}
          aria-expanded={showDesc}
        >
          <span>{showDesc ? 'Itago ang Paglalarawan' : 'Tingnan ang Paglalarawan'}</span>
          <span className="hero-desc-arrow">{showDesc ? '▲' : '▼'}</span>
        </button>

        {/* Expandable description */}
        {showDesc && (
          <div className="hero-desc-body">
            <p>
              &emsp;Ang pagsusuri ay isang masusing proseso ng pag-unawa, pagbibigay-kahulugan, at paghimay
              sa isang teksto, ideya, karanasan, o pangyayari upang matuklasan ang mas malalim nitong
              kahulugan. Hindi lamang ito nakatuon sa panlabas na anyo o impormasyong nakikita, kundi sa
              pagtukoy ng mga nakatagong mensahe at ugnayan ng bawat isang bahagi. Sa pamamagitan ng isang
              pagsusuri, nabubuo ang isang malinaw at komprehensibong pag-unawa sa kabuuan ng paksa, ideya
              o mga impormasyong may kakulangan sa pagpapaliwanag. Mahalaga rin ang paggamit ng ebidensya
              upang mapagtibay ang mga interpretasyon at maiwasan ang maling pagbasa at pagsusuri rito.
              Dahil dito, ang pagsusuri ay nagiging pundasyon ng mas mataas na antas ng pagkatuto at
              pag-iisip.
            </p>
            <p>
              &emsp;Sa aspektong akademiko, ang pagsusuri ay isang intelektuwal na gawain na nangangailangan
              ng lohikal, kritikal, at sistematikong pag-iisip. Kabilang dito ang pagtukoy sa layunin, tema,
              estruktura, at epekto ng isang akda o paksa. Hindi ito simpleng paglalarawan lamang, kundi
              isang mas malalim na proseso ng pagbibigay-interpretasyon batay sa datos, obserbasyon, at
              kaugnay na kaalaman. Mahalaga rin ang paghahambing at pag-uugnay ng mga ideya upang higit na
              mapalawak ang pananaw. Sa ganitong paraan, nagiging makabuluhan at makatotohanan ang pag-unawa
              sa isang paksa.
            </p>
            <p>
              &emsp;Higit pa rito, ang pagsusuri ay nagsisilbing tulay sa pagitan ng teorya at praktikal na
              aplikasyon ng kaalaman. Sa pamamagitan ng kritikal na pag-iisip, nagiging posible ang
              paglalapat ng natutunan sa mga tunay na sitwasyon sa buhay. Pinapalakas din nito ang kakayahang
              magpasya batay sa ebidensya at hindi lamang sa pansariling opinyon. Dahil dito, nagiging mas
              responsable at mapanuri ang isang indibidwal sa pagharap sa iba't ibang usapin. Ang pagsusuri,
              samakatuwid, ay hindi lamang isang kasanayang pang-akademiko kundi isang mahalagang kakayahan
              sa pang-araw-araw na pamumuhay.
            </p>
            <p>
              &emsp;Sa pag-aaral sa kolehiyo, partikular sa asignaturang panunuring pampanitikan, ang
              pagsusuri ay isang mahalagang kasangkapan upang maabot ang mas mataas na antas ng pagkatuto.
              Hindi sapat ang tanggapin lamang ang impormasyon; kinakailangang kwestyunin, suriin, at
              timbangin ang bawat detalye upang makabuo ng matibay na pag-unawa. Sa prosesong ito, nahuhubog
              ang kakayahang mag-isip nang malalim at makapagbigay ng lohikal na argumento. Natututuhan ding
              makita ang iba't ibang perspektibo, kaya't naiiwasan ang mababaw at isang panig na pagtingin
              sa mga bagay-bagay.
            </p>
            <p>
              &emsp;Sa kabuuan, ang pagsusuri ay hindi lamang isang gawain kundi isang mahalagang kasanayan
              na humuhubog sa intelektwal at personal na pag-unlad ng isang mag-aaral. Pinauunlad nito ang
              disiplina sa pag-aaral, tiwala sa sarili, at kakayahang magpahayag ng sariling ideya nang may
              batayan. Higit sa lahat, ito ay nagsisilbing sandigan upang maging isang malikhain, mapanuri,
              at responsableng indibidwal. Sa pamamagitan ng patuloy na pagsasanay sa pagsusuri, nagiging
              handa ang isang mag-aaral na harapin ang masalimuot na hamon ng akademikong mundo at ng tunay
              na buhay.
            </p>
          </div>
        )}
      </header>

      {/* ── Body: Book Spine + Levels ── */}
      <div className="pagsusuri-label-container">
        <div className="pagsusuri-batay-label">
          ANG PAGSUSURI BATAY SA MAY AKDA
        </div>
      </div>
      <main className="pagsusuri-body">

        {/* Level Cards — letter aligned with each row */}
        <section className="pagsusuri-levels" aria-label="Mga Antas ng Pagsusuri">
          {LEVELS.map((level) => (
            <div key={level.id} className="level-row">
              <div className="spine-letter" aria-hidden="true">{level.letter}</div>
              <div className="level-content">
                <h2 className="level-heading">{level.heading}</h2>
                <p className="level-text">{level.text}</p>
              </div>
            </div>
          ))}
        </section>

      </main>

      {/* ── Layunin ng Pagsusuri ── */}
      <section className="layunin-section">
        <div className="layunin-inner">

          {/* Title tag — same as TSA section tag */}
          <div className="layunin-tag">LAYUNIN NG PAGSUSURI</div>

          <p className="layunin-intro">
            Ang bawat gawain o ginagawa ng isang indibidwal o mag-aaral ay kinakailangang may tiyak na
            gampanin at layunin upang magkaroon ng direksyon at kabuluhan ang bawat hakbang na isinasagawa.
            Kaugnayin nito, ang pagsusuri ay isa sa mga mahahalagang kasanayan na nagbibigay saysay sa
            pag-aaral bilang isang pangunahing kasangkapan sa pag-iisip na intellectual ng isang mag-aaral.
          </p>

          {/* Clickable Step Cards */}
          <div className="layunin-steps" role="list">
            {LAYUNIN.map((item) => (
              <button
                key={item.number}
                className={`layunin-card${activeStep === item.number ? ' layunin-card--active' : ''}`}
                onClick={() => handleStepClick(item.number)}
                aria-expanded={activeStep === item.number}
                role="listitem"
              >
                <div className="layunin-card-number">{item.number}</div>
                <div className="layunin-card-label">{item.label}</div>
              </button>
            ))}
          </div>

          {/* Content Panel */}
          {activeStep && (() => {
            const item = LAYUNIN.find(i => i.number === activeStep);
            return (
              <div className="layunin-panel" key={activeStep}>
                <div className="layunin-panel-header">
                  <span className="layunin-panel-num">{item.number}</span>
                  <span className="layunin-panel-label">{item.label}</span>
                </div>
                <p className="layunin-panel-content">{item.content}</p>
              </div>
            );
          })()}

          <p className="layunin-note">
            Ang pangunahing layunin ng pagsusuri ay ang maunawaan nang malalim at mabigyan ng makabuluhang
            interpretasyon ang isang paksa, teksto, o karanasan. Hindi ito nakatuon sa simpleng pagkuha ng
            impormasyon, kundi sa paghimay ng mga ideya upang matukoy ang ugnayan, kahulugan, at layunin ng
            mga ito. Ito rin ay naglalayong malinang ang kritikal na pag-iisip upang makabuo ng matibay na
            konklusyon. Higit sa lahat, ang pagsusuri ay nagiging daan upang magamit ang kaalaman sa mas
            praktikal at makabuluhang paraan.
          </p>

        </div>
      </section>

      {/* ── Hakbang Timeline ── */}
      <section className="hakbang-section" aria-label="Mga Hakbang sa Pagsusuri">
        <div className="hakbang-inner">
          <h2 className="hakbang-title">
            Mga Hakbang sa Mabuting Pagsusuri<br />
            <span className="hakbang-title-sub">ng Akdang Pampanitikan</span>
          </h2>

          <div className="hakbang-timeline">

            {HAKBANG.map((step, i) => {
              const isVisible = visibleSteps.includes(step.number);
              return (
                <div
                  key={step.number}
                  data-step={step.number}
                  className={`hakbang-item hakbang-item--${i % 2 === 0 ? 'left' : 'right'} ${isVisible ? 'is-visible' : ''}`}
                >
                  {/* Dot on the spine */}
                  <div className="hakbang-dot" aria-hidden="true" />

                  {/* Card */}
                  <div className="hakbang-card">
                    <div className="hakbang-card-header">
                      <span className="hakbang-card-number">{step.number}</span>
                      <h3 className="hakbang-card-title">{step.title}</h3>
                    </div>
                    <p className="hakbang-card-text">{step.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}