import './bagongPamantayan.css';

const PAMANTAYAN_CARDS = [
  { id: 0, numeral: 'I', title: 'Panimulang Impormasyon' },
  { id: 1, numeral: 'II', title: 'Pag-unawa sa Akda' },
  { id: 2, numeral: 'III', title: 'Pagsusuring Pampanitikan (Tekstwal)' },
  { id: 3, numeral: 'IV', title: 'Pagsusuring Kontekstwal' },
  { id: 4, numeral: 'V', title: 'Makabagong Perspektibo' },
  { id: 5, numeral: 'VI', title: 'Personal na Pagsusuri' },
  { id: 6, numeral: 'VII', title: 'Bisa ng Akda' },
  { id: 7, numeral: 'VIII', title: '' },
];

export default function BagongPamantayan() {
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
        <header className="bp-hero">
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
        <section className="bp-section">
          <div className="bp-section-tag">PANIMULA</div>

          <div className="bp-intro-card">
            <p>
              Sa patuloy na pagbabago ng panahon at pag-unlad ng edukasyon, kinakailangan ding paunlarin ang mga pamamaraang ginagamit sa pagsusuri ng akdang pampanitikan. Ang mga tradisyunal na balangkas ay nagsilbing matibay na pundasyon sa paglinang ng kasanayan sa pag-aanalisa; gayunpaman, hindi na sapat ang mga ito upang matugunan ang masalimuot at dinamiko na pangangailangan ng makabagong pagkatuto. Sa kasalukuyan, ang panitikan ay hindi lamang binabasa at inuunawa, kundi sinusuri rin sa iba’t ibang lente: tekstwal, kontekstwal, at maging sa makabagong perspektibo.
            </p>

            <p>
              Bilang tugon sa pangangailangang ito, binuo ang Bagong Pamantayan sa Pagsusuri ng Akdang Pampanitikan na naglalayong magbigay ng mas komprehensibo, sistematiko, at makabuluhang gabay sa pagsusuri. Pinagsasama nito ang mahahalagang elemento ng tradisyunal na pagsusuri at ang mga makabagong lapit sa pag-unawa ng akda. Sa pamamagitan nito, hindi lamang nasusuri ang nilalaman at estruktura ng teksto, kundi naiuugnay rin ito sa kontekstong panlipunan, kultural, at sa personal na karanasan ng mambabasa.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
