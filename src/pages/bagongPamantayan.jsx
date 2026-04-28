import { useState } from 'react';
import './bagongPamantayan.css';

const PAMANTAYAN_CARDS = [
  {
    id: 0,
    numeral: 'I',
    title: 'Panimulang Impormasyon',
    items: [
      'Titulo ng Akda',
      'May-akda / Direktor / Tagasalin',
      'Maikling Talambuhay (may larawan kung mayroon) ng May-Akda',
      'Sanggunian',
    ],
  },
  {
    id: 1,
    numeral: 'II',
    title: 'Pag-unawa sa Akda',
    items: [
      'Paksa',
      'Tema',
      'Layunin — Layunin sa loob ng akda',
      'Layunin — Layunin ng awtor',
      'Layunin — Layunin sa Mambabasa',
      'Mga Tauhan',
      'Mga Suliranin',
      'Kasukdulan',
      'Paghawan ng Sagabal',
      'Kakalasan',
      'Paglalahat',
    ],
  },
  {
    id: 2,
    numeral: 'III',
    title: 'Pagsusuring Pampanitikan (Tekstwal)',
    items: [
      'Istilo ng Pagsulat ng Awtor',
      'Kayarian ng Akda (Baliktad na Piramide, Kronolohikal na Ayos, atbp.)',
      'Mga Tayutay',
      'Mga Simbolismo',
      'Integrasyong Pangbalyus / Values Integration (Mga Aral na Mapupulot sa Akda)',
    ],
  },
  {
    id: 3,
    numeral: 'IV',
    title: 'Pagsusuring Kontekstwal',
    items: [
      'Teoryang Pampanitikan (Mga teoryang ginamit sa akda)',
      'Indibidwal at Kalagayang Sosyal',
      'Kulturang Namamayani',
      'Paniniwala at Tradisyon sa Loob ng Akda',
    ],
  },
  {
    id: 4,
    numeral: 'V',
    title: 'Makabagong Perspektibo',
    items: [
      'Kaugnayan sa Kasalukuyang Panahon (hal. social media, global issues)',
      'Pagtingin batay sa iba\'t ibang lente (hal. gender, kabataan, identidad)',
    ],
  },
  {
    id: 5,
    numeral: 'VI',
    title: 'Personal na Pagsusuri',
    items: [
      'Repleksyon (sariling opinyon patungkol sa akda)',
      'Komento, Suhestiyon at Rekomendasyon',
    ],
  },
  {
    id: 6,
    numeral: 'VII',
    title: 'Bisa ng Akda',
    items: [
      'Bisa sa Isip o Kognitibong Aspekto',
      'Bisa sa Pag-uugali / Damdamin',
      'Bisa sa Kasanayang Panunuri',
    ],
  },
];

export default function BagongPamantayan() {
  const [activeCard, setActiveCard] = useState(null);
  const [selectedModalCard, setSelectedModalCard] = useState(null);
  return (
    <div className="bp-root">

      {/* ── Static background ── */}
      <div className="bp-bg" aria-hidden="true">
        <div className="bp-bg-grid" />
        <div className="bp-bg-glow bp-bg-glow--1" />
        <div className="bp-bg-glow bp-bg-glow--2" />
        <div className="bp-bg-glow bp-bg-glow--3" />
      </div>

      <div className="bp-container">

        {/* ── Hero ── */}
        <header className="bp-hero" id="bp-hero">
          <div className="bp-hero-eyebrow">
            <span className="bp-eyebrow-line" />
            <span className="bp-eyebrow-label">Pamantayan sa Pagsusuri ng Akdang Pampanitikan</span>
            <span className="bp-eyebrow-line" />
          </div>
          <h1 className="bp-hero-title">Bagong Pamantayan</h1>
          <div className="bp-hero-rule" aria-hidden="true">
            <span /><span className="bp-rule-diamond" /><span />
          </div>
        </header>

        {/* ── Intro / Body text section ── */}
        <section className="bp-section" id="bp-panimula">
          <div className="bp-section-tag">PANIMULA</div>

          <div className="bp-intro-card">
            <p>
              Sa patuloy na pagbabago ng panahon at pag-unlad ng edukasyon, kinakailangan ding paunlarin ang mga pamamaraang ginagamit sa pagsusuri ng akdang pampanitikan. Ang mga tradisyunal na balangkas ay nagsilbing matibay na pundasyon sa paglinang ng kasanayan sa pag-aanalisa; gayunpaman, hindi na sapat ang mga ito upang matugunan ang masalimuot at dinamiko na pangangailangan ng makabagong pagkatuto. Sa kasalukuyan, ang panitikan ay hindi lamang binabasa at inuunawa, kundi sinusuri rin sa iba't ibang lente: tekstwal, kontekstwal, at maging sa makabagong perspektibo.
            </p>

            <p>
              Bilang tugon sa pangangailangang ito, binuo ang Bagong Pamantayan sa Pagsusuri ng Akdang Pampanitikan na naglalayong magbigay ng mas komprehensibo, sistematiko, at makabuluhang gabay sa pagsusuri. Pinagsasama nito ang mahahalagang elemento ng tradisyunal na pagsusuri at ang mga makabagong lapit sa pag-unawa ng akda. Sa pamamagitan nito, hindi lamang nasusuri ang nilalaman at estruktura ng teksto, kundi naiuugnay rin ito sa kontekstong panlipunan, kultural, at sa personal na karanasan ng mambabasa.
            </p>
          </div>
        </section>

      <div style={{ height: "40px" }} />

      {/* ── Pamantayan Cards ────────────────────────────────── */}
      <section className="hp-cards-section" id="bp-cards-section">
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
                  id={`bp-card-${card.numeral}`}
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

            <div className="hp-table-container hp-table-rubric-container" id="bp-rubric-nilalaman">
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

            <div className="hp-table-container hp-table-rubric-container" id="bp-rubric-kritikal">
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

            <div className="hp-table-container hp-table-rubric-container" id="bp-rubric-organisasyon">
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

            <div className="hp-table-container hp-table-rubric-container" id="bp-rubric-mekaniks">
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

            <div className="hp-table-container hp-table-rubric-container" id="bp-kabuuan">
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
      </div>
    </div>
  );
}