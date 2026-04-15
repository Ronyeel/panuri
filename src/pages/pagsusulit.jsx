import { useState, useCallback } from 'react';
import './pagsusulit.css';

// ─────────────────────────────────────────────────────────────
// DATA — swap this out or fetch from an API / props
// ─────────────────────────────────────────────────────────────
const QUIZ_DATA = [
  {
    id: 'kasaysayan',
    label: 'Kasaysayan',
    questions: [
      {
        id: 'q1',
        text: 'Sino ang itinuturing na "Ama ng Bansang Pilipinas"?',
        choices: [
          { id: 'a', text: 'Andrés Bonifacio' },
          { id: 'b', text: 'José Rizal' },
          { id: 'c', text: 'Emilio Aguinaldo' },
          { id: 'd', text: 'Apolinario Mabini' },
        ],
        correctId: 'b',
        explanation:
          'Si José Rizal ang kinikilalang pambansang bayani at "Ama ng Bansang Pilipinas" dahil sa kanyang mga akda na nagpukaw ng nasyonalismo.',
      },
      {
        id: 'q2',
        text: 'Sa anong taon idineklara ang kalayaan ng Pilipinas mula sa pananakop ng Espanya?',
        choices: [
          { id: 'a', text: '1896' },
          { id: 'b', text: '1898' },
          { id: 'c', text: '1901' },
          { id: 'd', text: '1946' },
        ],
        correctId: 'b',
        explanation:
          'Noong Hunyo 12, 1898, idineklara ni Emilio Aguinaldo ang kalayaan ng Pilipinas sa Kawit, Cavite.',
      },
      {
        id: 'q3',
        text: 'Anong kilusan ang itinatag ni Andrés Bonifacio noong 1892?',
        choices: [
          { id: 'a', text: 'La Liga Filipina' },
          { id: 'b', text: 'Propaganda Movement' },
          { id: 'c', text: 'Katipunan' },
          { id: 'd', text: 'Magdalo' },
        ],
        correctId: 'c',
        explanation:
          'Itinatag ni Andrés Bonifacio ang Katipunan (Kataas-taasang, Kagalang-galangang Katipunan ng mga Anak ng Bayan) noong Hulyo 7, 1892.',
      },
      {
        id: 'q4',
        text: 'Anong pangalan ang ibinigay sa unang konstitusyon ng Pilipinas na isinulat noong 1899?',
        choices: [
          { id: 'a', text: 'Saligang Batas ng 1935' },
          { id: 'b', text: 'Konstitusyon ng Malolos' },
          { id: 'c', text: 'Konstitusyon ng 1973' },
          { id: 'd', text: 'Batas Pambansa' },
        ],
        correctId: 'b',
        explanation:
          'Ang Konstitusyon ng Malolos ang unang demokratikong konstitusyon sa Asya, isinulat noong Enero 21, 1899 sa Malolos, Bulacan.',
      },
      {
        id: 'q5',
        text: 'Sino ang pangulo ng Pilipinas nang manumbalik ang demokrasya pagkatapos ng martial law?',
        choices: [
          { id: 'a', text: 'Fidel V. Ramos' },
          { id: 'b', text: 'Corazon C. Aquino' },
          { id: 'c', text: 'Joseph Estrada' },
          { id: 'd', text: 'Salvador Laurel' },
        ],
        correctId: 'b',
        explanation:
          'Si Corazon C. Aquino ang naging pangulo matapos ang People Power Revolution noong 1986, na nagpabagsak sa pamumuno ni Ferdinand Marcos.',
      },
    ],
  },
  {
    id: 'panitikan',
    label: 'Panitikan',
    questions: [
      {
        id: 'q1',
        text: 'Anong nobela ni José Rizal ang naglalarawan ng kalagayan ng mga Pilipino sa ilalim ng pamamahala ng mga Espanyol?',
        choices: [
          { id: 'a', text: 'Florante at Laura' },
          { id: 'b', text: 'Noli Me Tangere' },
          { id: 'c', text: 'Ibong Adarna' },
          { id: 'd', text: 'Banaag at Sikat' },
        ],
        correctId: 'b',
        explanation:
          'Ang Noli Me Tangere (1887) ay nobelang nagbunyag ng korupsyon at pang-aabuso ng mga prayle at kolonyal na pamahalaan sa Pilipinas.',
      },
      {
        id: 'q2',
        text: 'Sino ang may-akda ng "Florante at Laura"?',
        choices: [
          { id: 'a', text: 'Francisco Balagtas' },
          { id: 'b', text: 'José Rizal' },
          { id: 'c', text: 'Lope K. Santos' },
          { id: 'd', text: 'Claro M. Recto' },
        ],
        correctId: 'a',
        explanation:
          'Si Francisco Balagtas (Francisco Baltazar) ang sumulat ng awit na "Florante at Laura" na itinuturing na obra maestra ng panitikang Tagalog.',
      },
      {
        id: 'q3',
        text: 'Ano ang tawag sa tradisyonal na tulang Pilipino na may sukat at tugma?',
        choices: [
          { id: 'a', text: 'Haiku' },
          { id: 'b', text: 'Tanaga' },
          { id: 'c', text: 'Sonnet' },
          { id: 'd', text: 'Diona' },
        ],
        correctId: 'b',
        explanation:
          'Ang Tanaga ay isang tradisyonal na anyo ng tulang Tagalog na may apat na taludtod, bawat isa ay may pitong pantig, at may tugmaan.',
      },
      {
        id: 'q4',
        text: 'Ang "El Filibusterismo" ay ang pangalawang nobela ni Rizal. Ano ang literal na kahulugan ng pamagat?',
        choices: [
          { id: 'a', text: 'Ang Pag-aari ng Liwanag' },
          { id: 'b', text: 'Ang Paglago ng Subversibo' },
          { id: 'c', text: 'Ang Paghahari ng Kasakiman' },
          { id: 'd', text: 'Laban sa Kasamaan' },
        ],
        correctId: 'b',
        explanation:
          '"El Filibusterismo" ay mula sa salitang "filibustero" na nangangahulugang subversibo o taong nagtataguyod ng rebolusyon.',
      },
      {
        id: 'q5',
        text: 'Anong akda ang nagbigay sa Pilipinas ng pambansang awit?',
        choices: [
          { id: 'a', text: 'Lupang Hinirang — teksto ni José Palma' },
          { id: 'b', text: 'Bayan Ko — teksto ni Constancio de Guzman' },
          { id: 'c', text: 'Pilipinas Kong Mahal — teksto ni Felipe de Leon' },
          { id: 'd', text: 'Sapagkat Kami ay Pilipino' },
        ],
        correctId: 'a',
        explanation:
          'Ang "Lupang Hinirang" ay may orihinal na titulo na "Filipinas." Isinulat ang titik ni José Palma noong 1899; musika ni Julián Felipe.',
      },
    ],
  },
  {
    id: 'kultura',
    label: 'Kultura',
    questions: [
      {
        id: 'q1',
        text: 'Ano ang tawag sa tradisyonal na sayaw ng Pilipinas na nagmula sa salitang "tinikling"?',
        choices: [
          { id: 'a', text: 'Pandanggo sa Ilaw' },
          { id: 'b', text: 'Cariñosa' },
          { id: 'c', text: 'Tinikling' },
          { id: 'd', text: 'Singkil' },
        ],
        correctId: 'c',
        explanation:
          'Ang Tinikling ay pambansang sayaw ng Pilipinas, ginagawa sa pamamagitan ng paglukso sa pagitan ng dalawang bamboo. Nagmula sa ibon na tikling.',
      },
      {
        id: 'q2',
        text: 'Anong pista opisyal ang nagdiriwang sa lahat ng yumao tuwing Nobyembre 1?',
        choices: [
          { id: 'a', text: 'Undas / Araw ng mga Patay' },
          { id: 'b', text: 'Todos los Santos' },
          { id: 'c', text: 'Pista ng mga Anghel' },
          { id: 'd', text: 'Araw ng Kapayapaan' },
        ],
        correctId: 'b',
        explanation:
          'Ang Todos los Santos (Nobyembre 1) ay ang Araw ng Lahat ng Banal. Nobyembre 2 naman ang Undas o Araw ng mga Patay (Araw ng mga Kaluluwa).',
      },
      {
        id: 'q3',
        text: 'Anong wika ang opisyal na wikang pambansa ng Pilipinas ayon sa Konstitusyon ng 1987?',
        choices: [
          { id: 'a', text: 'Tagalog' },
          { id: 'b', text: 'Filipino' },
          { id: 'c', text: 'Ingles' },
          { id: 'd', text: 'Pilipino' },
        ],
        correctId: 'b',
        explanation:
          'Ang Filipino, batay sa Tagalog, ang itinakda ng Konstitusyon ng 1987 bilang pambansang wika at kasabay na opisyal na wika kasama ng Ingles.',
      },
      {
        id: 'q4',
        text: 'Ano ang kahulugan ng salitang "bayanihan"?',
        choices: [
          { id: 'a', text: 'Pagmamahal sa sariling bayan' },
          { id: 'b', text: 'Sama-samang pagtutulungan ng komunidad' },
          { id: 'c', text: 'Tradisyonal na sining ng pagluluto' },
          { id: 'd', text: 'Paggalang sa matatanda' },
        ],
        correctId: 'b',
        explanation:
          'Ang "Bayanihan" ay nagmula sa salitang "bayan" (komunidad). Ito ay nagpapahayag ng espiritu ng sama-samang pagtulong, tulad ng pagdadala ng bahay na kawayan.',
      },
      {
        id: 'q5',
        text: 'Anong instrumento ang karaniwang ginagamit sa tradisyonal na musika ng mga Maranao?',
        choices: [
          { id: 'a', text: 'Kudyapi' },
          { id: 'b', text: 'Kulintang' },
          { id: 'c', text: 'Bandurria' },
          { id: 'd', text: 'Rondalla' },
        ],
        correctId: 'b',
        explanation:
          'Ang Kulintang ay isang hanay ng maliliit na kampana (gong) na ginagamit ng mga Maranao, Maguindanao, at iba pang pangkat sa Mindanao.',
      },
    ],
  },
];

const LETTERS = ['A', 'B', 'C', 'D'];

function getVerdict(score, total) {
  const pct = score / total;
  if (pct === 1)   return 'Perpekto! Tunay kang dalubhasà.';
  if (pct >= 0.8)  return 'Napakahusay! Malapit ka na sa katumbusan.';
  if (pct >= 0.6)  return 'Magaling! May kaalaman ka, ngunit lagi pang puwang para lumago.';
  if (pct >= 0.4)  return 'Hindi masama. Pag-aralan muli at subuking muli!';
  return 'Huwag panghinaan ng loob — ang kabiguan ay simula ng karunungan.';
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Pagsuslit({ quizData = QUIZ_DATA }) {
  const [activeQuizId, setActiveQuizId]   = useState(quizData[0]?.id ?? null);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [selectedId, setSelectedId]       = useState(null);   // chosen answer
  const [answered, setAnswered]           = useState(false);
  const [score, setScore]                 = useState(0);
  const [finished, setFinished]           = useState(false);

  const activeQuiz = quizData.find(q => q.id === activeQuizId);
  const questions  = activeQuiz?.questions ?? [];
  const question   = questions[currentIndex];
  const total      = questions.length;

  const handleSelectQuiz = useCallback((id) => {
    setActiveQuizId(id);
    setCurrentIndex(0);
    setSelectedId(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }, []);

  const handleChoose = useCallback((choiceId) => {
    if (answered) return;
    setSelectedId(choiceId);
    setAnswered(true);
    if (choiceId === question.correctId) {
      setScore(s => s + 1);
    }
  }, [answered, question]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedId(null);
      setAnswered(false);
    }
  }, [currentIndex, total]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setSelectedId(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }, []);

  const progressPct = total > 0
    ? ((currentIndex + (answered ? 1 : 0)) / total) * 100
    : 0;

  return (
    <section className="pagsuslit" aria-label="Pagsuslit — Pagsusulit">
      <div className="pagsuslit-inner">

        {/* Header */}
        <header className="pagsuslit-header">
          <div className="pagsuslit-eyebrow">Subukan ang Iyong Kaalaman</div>
          <h2 className="pagsuslit-title">Pagsuslit</h2>
          <p className="pagsuslit-subtitle">
            Piliin ang kategorya at simulan ang pagsusulit
          </p>
        </header>

        {/* Category selector */}
        <nav className="pagsuslit-selector" aria-label="Kategorya ng pagsusulit">
          {quizData.map(quiz => (
            <button
              key={quiz.id}
              className={`pagsuslit-selector-btn${activeQuizId === quiz.id ? ' active' : ''}`}
              onClick={() => handleSelectQuiz(quiz.id)}
            >
              {quiz.label}
            </button>
          ))}
        </nav>

        {/* Quiz Card */}
        <div className="pagsuslit-card" role="main">

          {finished ? (
            /* ── Results ── */
            <div className="pagsuslit-results">
              <div className="pagsuslit-results-label">Iyong Puntos</div>
              <div className="pagsuslit-results-score">
                {score}
                <span className="pagsuslit-results-denom">/{total}</span>
              </div>
              <p className="pagsuslit-results-verdict">
                {getVerdict(score, total)}
              </p>
              <div className="pagsuslit-results-actions">
                <button className="pagsuslit-retry-btn" onClick={handleRetry}>
                  ↩ Ulit
                </button>
                {quizData.length > 1 && (
                  <button
                    className="pagsuslit-other-btn"
                    onClick={() => {
                      const others = quizData.filter(q => q.id !== activeQuizId);
                      handleSelectQuiz(others[0].id);
                    }}
                  >
                    Ibang Kategorya
                  </button>
                )}
              </div>
            </div>
          ) : question ? (
            /* ── Question ── */
            <>
              {/* Progress */}
              <div className="pagsuslit-progress">
                <div className="pagsuslit-progress-track" role="progressbar"
                  aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={total}>
                  <div
                    className="pagsuslit-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="pagsuslit-progress-label">
                  <span>{currentIndex + 1}</span> / {total}
                </div>
              </div>

              {/* Question text */}
              <div className="pagsuslit-question-wrap">
                <div className="pagsuslit-question-num">
                  Tanong {currentIndex + 1}
                </div>
                <p className="pagsuslit-question-text">{question.text}</p>
              </div>

              {/* Choices */}
              <div className="pagsuslit-choices" role="list">
                {question.choices.map((choice, idx) => {
                  let stateClass = '';
                  if (answered) {
                    if (choice.id === question.correctId) {
                      stateClass = ' revealed';
                    } else if (choice.id === selectedId) {
                      stateClass = ' wrong';
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      role="listitem"
                      className={`pagsuslit-choice${stateClass}`}
                      onClick={() => handleChoose(choice.id)}
                      disabled={answered}
                      aria-pressed={selectedId === choice.id}
                    >
                      <span className="pagsuslit-choice-letter">
                        {LETTERS[idx]}
                      </span>
                      <span className="pagsuslit-choice-text">{choice.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {answered && question.explanation && (
                <div className="pagsuslit-explanation" role="alert">
                  <span className="pagsuslit-explanation-icon">
                    {selectedId === question.correctId ? '✓' : '✕'}
                  </span>
                  <p className="pagsuslit-explanation-text">
                    {question.explanation}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pagsuslit-card-footer">
                <div className="pagsuslit-score-inline">
                  Puntos: <span>{score}</span>
                </div>
                <button
                  className="pagsuslit-next-btn"
                  onClick={handleNext}
                  disabled={!answered}
                >
                  {currentIndex + 1 >= total ? 'Tingnan ang Resulta →' : 'Susunod →'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontFamily: "'Crimson Text', serif", textAlign: 'center', padding: '2rem 0' }}>
              Walang mga tanong para sa kategoryang ito.
            </p>
          )}

        </div>
      </div>
    </section>
  );
}