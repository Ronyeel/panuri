import { useNavigate } from 'react-router-dom';
import './teoryangPampanitikan.css';

export default function TeoryangPampanitikan() {
  const navigate = useNavigate();

  return (
    <main className="teorya-page">
      <div className="teorya-container">

        {/* Top Header */}
        <header className="teorya-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Bumalik
          </button>
          <h1 className="main-title">TEORYANG PAMPANITIKAN</h1>
        </header>

        <div className="content-wrapper">
          
          {/* Book Spine */}
          <div className="book-spine">
            <div className="spine-text">
              T<br />E<br />O<br />R<br />Y<br />A
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">

            {/* Introduction */}
            <section className="section">
              <h2 className="section-title">Pag-unawa sa Teoryang Pampanitikan</h2>
              <p className="section-text">
                Ang teoryang pampanitikan ay mga pamamaraan o lente kung saan tinutunghayan at pinagsusuri ang mga akdang pampanitikan. Ito ay nagbibigay ng iba't ibang perspektibo upang mas malalim na maunawaan ang teksto, may-akda, mambabasa, at lipunan.
              </p>
            </section>

            {/* Main Theories Grid */}
            <section className="theories-section">
              <h2 className="section-title">Mga Pangunahing Teoryang Pampanitikan</h2>
              
              <div className="theories-grid">
                
                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">01</span>
                    <h3>Formalismo</h3>
                  </div>
                  <p>Pinag-aaralan ang anyo, istruktura, wika, at teknik ng akda. Hindi gaanong binibigyang-pansin ang labas na konteksto.</p>
                </div>

                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">02</span>
                    <h3>Marxismo</h3>
                  </div>
                  <p>Tinutunghayan ang mga isyu ng uri, kapangyarihan, at sosyal na kondisyon sa loob ng akda.</p>
                </div>

                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">03</span>
                    <h3>Feminismo</h3>
                  </div>
                  <p>Pinag-aaralan ang representasyon ng kababaihan, kasarian, at patriyarkal na istruktura sa panitikan.</p>
                </div>

                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">04</span>
                    <h3>Reader-Response</h3>
                  </div>
                  <p>Ang kahulugan ng akda ay nakasalalay sa karanasan at interpretasyon ng mambabasa.</p>
                </div>

                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">05</span>
                    <h3>Postkolonyalismo</h3>
                  </div>
                  <p>Pinag-aaralan ang epekto ng kolonyalismo, identidad, at kultura sa mga akda.</p>
                </div>

                <div className="theory-card">
                  <div className="theory-header">
                    <span className="theory-number">06</span>
                    <h3>Strukturalismo</h3>
                  </div>
                  <p>Binibigyang-pansin ang mga binary opposites at sistemang palatandaan sa teksto.</p>
                </div>

              </div>
            </section>

            {/* Bottom Note */}
            <section className="note-section">
              <p>
                Ang bawat teorya ay nagbibigay ng kani-kanyang lente upang mas masilayan ang kagandahan at lalim ng isang akda. Sa pag-aaral ng panitikan, mahalagang malaman kung aling teorya ang pinakaangkop sa akda na pinagsusuri.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}