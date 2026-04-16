import React from 'react';
import './Pagsusuri.css';

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

const STEPS = [
  { number: '01', label: 'Layunin ng Pag-aaral' },
  { number: '02', label: 'Gabay ng Pag-aaral' },
  { number: '03', label: 'Aktibidad ng Pag-aaral' },
  { number: '04', label: 'Pagtatasa ng Pag-aaral' },
  { number: '05', label: 'Repleksyon ng Pag-aaral' },
];

export default function Pagsusuri() {
  return (
    <div className="pagsusuri-page">

      {/* ── Hero ── */}
      <header className="pagsusuri-hero">
        <p className="hero-eyebrow">Pagsusuri</p>
        <h1 className="hero-title">
          Ano ba ang Pagsusuri para sa isang katulad kong Mapaghamong Mag-aaral?
        </h1>
        <p className="hero-subtitle">
          This is a description
        </p>
      </header>

      {/* ── Body: Book Spine + Levels ── */}
      <main className="pagsusuri-body">

        {/* Book Spine */}
        <aside className="pagsusuri-spine" aria-hidden="true">
          <div className="spine-cap">
            <div className="spine-cap-line" />
            <div className="spine-cap-dot" />
            <div className="spine-cap-line" />
          </div>

          <div className="spine-letters">
            {LEVELS.map((level) => (
              <div key={level.id} className="spine-letter">
                {level.letter}
              </div>
            ))}
          </div>

          <div className="spine-cap">
            <div className="spine-cap-line" />
            <div className="spine-cap-dot" />
            <div className="spine-cap-line" />
          </div>
        </aside>

        {/* Level Cards */}
        <section className="pagsusuri-levels" aria-label="Mga Antas ng Pagsusuri">
          {LEVELS.map((level) => (
            <div key={level.id} className="level-row">
              <div className="level-content">
                <h2 className="level-heading">{level.heading}</h2>
                <p className="level-text">{level.text}</p>
              </div>
            </div>
          ))}
        </section>

      </main>

      <div className="ornament">◆ &nbsp; ◆ &nbsp; ◆</div>

      {/* ── Footer / Layunin ── */}
      <footer className="pagsusuri-footer">
        <div className="footer-inner">

          <h3 className="footer-title">Layunin ng Pagsusuri</h3>

          <p className="footer-intro">
            Ang bawat gawain o ginagawa ng isang indibidwal o mag-aaral ay kinakailangang may tiyak na
            gampanin at layunin upang magkaroon ng direksyon at kabuluhan ang bawat hakbang na isinasagawa.
            Ang pagsusuri ay isa sa mga mahahalagang kasanayan na nagbibigay saysay sa pag-aaral sapagkat
            pinauunlad nito ang pag-iisip, pag-unawa, at pagpasya.
          </p>

          <div className="steps-row" role="list">
            {STEPS.map((step) => (
              <div key={step.number} className="step-card" role="listitem">
                <div className="step-number">{step.number}</div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>

          <p className="footer-note">
            Ang pangunahing layunin ng pagsusuri ay ang maunawaan nang malalim at mabigyan ng makabuluhang interpretasyon ang isang paksa, teksto, o karanasan. Hindi ito nakatuon sa simpleng pagkuha ng impormasyon, kundi sa paghimay ng mga ideya upang matukoy ang ugnayan, kahulugan, at layunin ng mga ito. Layunin din nitong matukoy kung ang isang pahayag o konsepto ay may sapat na batayan at lohikal na pagkakabuo. Sa pamamagitan ng pagsusuri, nagiging malinaw kung alin ang mahalaga, totoo, at kapani-paniwala sa isang paksa. Ito rin ay naglalayong malinang ang kritikal na pag-iisip upang makabuo ng matibay na konklusyon. Higit sa lahat, ang pagsusuri ay nagiging daan upang magamit ang kaalaman sa mas praktikal at makabuluhang paraan.
          </p>

        </div>
      </footer>

    </div>
  );
}