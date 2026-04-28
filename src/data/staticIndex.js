// src/data/staticIndex.js
// Shape: { id, title, body, category, path, section }
// path may include a #hash — the router + ScrollToHash hook will scroll there.

import LAYUNIN from './layunin.json'
import HAKBANG from './hakbang.json'

const PAMANTAYAN_CARDS = [
  { numeral: 'I',   title: 'Panimulang Impormasyon', items: ['Titulo ng Akda','May-akda / Direktor / Tagasalin','Maikling Talambuhay ng May-Akda','Sanggunian'] },
  { numeral: 'II',  title: 'Pag-unawa sa Akda',      items: ['Paksa','Tema','Layunin','Mga Tauhan','Mga Suliranin','Kasukdulan','Paghawan ng Sagabal','Kakalasan','Paglalahat'] },
  { numeral: 'III', title: 'Pagsusuring Pampanitikan (Tekstwal)', items: ['Istilo ng Pagsulat ng Awtor','Kayarian ng Akda','Mga Tayutay','Mga Simbolismo','Integrasyong Pangbalyus'] },
  { numeral: 'IV',  title: 'Pagsusuring Kontekstwal', items: ['Teoryang Pampanitikan','Indibidwal at Kalagayang Sosyal','Kulturang Namamayani','Paniniwala at Tradisyon'] },
  { numeral: 'V',   title: 'Makabagong Perspektibo', items: ['Kaugnayan sa Kasalukuyang Panahon','Pagtingin batay sa iba\'t ibang lente'] },
  { numeral: 'VI',  title: 'Personal na Pagsusuri',  items: ['Repleksyon','Komento, Suhestiyon at Rekomendasyon'] },
  { numeral: 'VII', title: 'Bisa ng Akda',           items: ['Bisa sa Isip o Kognitibong Aspekto','Bisa sa Pag-uugali / Damdamin','Bisa sa Kasanayang Panunuri'] },
]

const LEVELS = [
  { heading: 'Pag-unawa',        text: 'Ito ang unang hakbang sa pagsusuri kung saan inuunawa ang kabuuang ideya ng teksto o paksa. Mahalaga ang malinaw na pag-unawa upang magkaroon ng matibay na pundasyon sa susunod na hakbang.' },
  { heading: 'Analisis',         text: 'Sa bahaging ito, tinutulak tayo sa isang malalim na pag-aaral ng bawat nilalaman. Binibigyang-diin ang detalye, impormasyon, at ugnayin ng mga ideya.' },
  { heading: 'Gabay ng Ebidensya', text: 'Sa bahaging ito, tinutulungan ang mag-aaral na mahanap at makilala ang mga ebidensya at ugnayin ng mga ideya na magiging batayan ng kanilang mga pagsusuri.' },
  { heading: 'Sintesis',         text: 'Matuto sarin ang mga huling pinagsama-samang mga ideya upang maisang-isip ang kabuuan. Sa pamamagitan ng sintesis, ang mga mag-aaral ay magiging handa sa mas mataas na antas ng pag-iisip.' },
  { heading: 'Ugnayan',          text: 'Tinatasa ang mga koneksyon ng bawat mag-aaral at inuugnay ang pag-aaral sa totoong buhay. Ang layunin ng bahaging ito ay upang malaman ng mga mag-aaral ang kahalagahan ng kanilang mga natutuhan.' },
  { heading: 'Sariling Pananaw', text: 'Sa bahaging ito, hinihikayat ang mag-aaral na magpahayag ng kanilang mga saloobin at pananaw. Mahalaga ang bahaging ito na makamit ang mataas na antas ng pag-iisip.' },
  { heading: 'Unawang Malalim',  text: 'Ang pag-unawa sa ikatlong antas ng pagsusuri ay nagbibigay-daan sa mag-aaral na ipakita ang mataas na antas ng pag-iisip at interpretasyon.' },
  { heading: 'Repleksyon',       text: 'Ang repleksyon ay nagpapalalim ng pag-aaral, dito sinisiyasat ng mag-aaral ang kanilang sariling pag-unlad at kakayahan sa hinaharap.' },
  { heading: 'Integrasyon',      text: 'Sa huling hakbang, isinasama ang lahat ng mga pag-aaral sa isang maayos na kabuuan. Nagbibigay ng pagkakataon na ikonekta ang lahat ng natutuhan sa mas malawak na konteksto.' },
]

const staticIndex = [

  // ── HOME ──────────────────────────────────────────────────────────────────
  { id: 'home-hero',            title: 'Home — Tampok na Aklat',              body: 'Maligayang Pagdating sa PANURI. Tampok na Aklat. Basahin ang mga piling aklat at excerpts ng panitikang Filipino.',                                                           category: 'Home',               section: 'Hero',                       path: '/#home-hero' },
  { id: 'home-school-banner',   title: 'Home — Camarines Norte State College', body: 'Magsulat. Magbasa. Magsuri. Patungo sa Holistikong Kasanayan at Kaalamang Panunuri.',                                                                                            category: 'Home',               section: 'School Banner',              path: '/#home-school-banner' },
  { id: 'home-cta-excerpts',    title: 'Home — Basahin ang mga Excerpts',      body: 'Para sa mga Manunulat at Mambabasa. Basahin ang mga Excerpts ng piling akdang pampanitikan.',                                                                                     category: 'Home',               section: 'CTA Excerpts',               path: '/excerpts' },
  { id: 'home-cta-bp',         title: 'Home — Bagong Pamantayan',             body: 'Ang tunay na pag-unawa ay nagsisimula hindi sa pagbabasa lamang, kundi sa masusing pagsusuri ng kahulugan sa likod ng bawat salita.',                                             category: 'Home',               section: 'CTA Bagong Pamantayan',     path: '/bagong-pamantayan' },

  // ── MGA LIBRO ─────────────────────────────────────────────────────────────
  { id: 'mga-libro-page',       title: 'Mga Libro — Koleksyon ng mga Aklat',   body: 'Koleksyon ng mga aklat at panitikang Filipino. Maghanap ng libro, magsuri ng mga akda. Mga nobela, tula, maikling kuwento.',                                                     category: 'Mga Libro',          section: 'Koleksyon',                  path: '/mga-libro' },
  { id: 'libro-para-kay-b',     title: 'Para Kay B — Ricky Lee',               body: 'Para Kay B ni Ricky Lee. Nobela. 1983. Me Quota ang pag-ibig. Sa bawat limang umiibig ay isa lang ang magiging maligaya.',                                                         category: 'Libro',              section: 'Mga Libro',                  path: '/mga-libro' },

  // ── EXCERPTS ──────────────────────────────────────────────────────────────
  { id: 'excerpts-page',        title: 'Excerpts — Mga Sipi ng Akda',          body: 'Mga sipi o excerpt ng mga piling akdang pampanitikan. Basahin ang mga piniling talata at bahagi ng mga aklat.',                                                                    category: 'Excerpts',           section: 'Mga Sipi',                   path: '/excerpts' },

  // ── PAGSUSURI ─────────────────────────────────────────────────────────────
  { id: 'pagsusuri-hero',       title: 'Pagsusuri — Ano ba ang Pagsusuri?',    body: 'Ano ba ang Pagsusuri para sa isang katulad kong Mapaghamong Mag-aaral? Ang pagsusuri ay isang masusing proseso ng pag-unawa, pagbibigay-kahulugan, at paghimay sa isang teksto.', category: 'Pagsusuri',          section: 'Hero',                       path: '/pagsusuri#pagsusuri-hero' },
  { id: 'pagsusuri-desc',       title: 'Pagsusuri — Kahulugan at Kahalagahan', body: 'Ang pagsusuri ay hindi lamang nakatuon sa panlabas na anyo o impormasyong nakikita, kundi sa pagtukoy ng mga nakatagong mensahe. Sa aspektong akademiko, ang pagsusuri ay isang intelektuwal na gawain na nangangailangan ng lohikal, kritikal, at sistematikong pag-iisip.', category: 'Pagsusuri', section: 'Paglalarawan', path: '/pagsusuri#pagsusuri-hero' },
  { id: 'pagsusuri-levels-section', title: 'Pagsusuri — Ang Pagsusuri Batay sa May-Akda', body: 'Ang Pagsusuri Batay sa May-Akda. PAGSUSURI akronim: Pag-unawa, Analisis, Gabay ng Ebidensya, Sintesis, Ugnayan, Sariling Pananaw, Unawang Malalim, Repleksyon, Integrasyon.', category: 'Pagsusuri', section: 'Mga Antas', path: '/pagsusuri#pagsusuri-levels-section' },

  // LEVELS — each gets its own anchor
  ...LEVELS.map((l, i) => ({
    id:       `pagsusuri-level-${i}`,
    title:    `Pagsusuri — ${l.heading}`,
    body:     l.text,
    category: 'Pagsusuri',
    section:  'Mga Antas ng Pagsusuri',
    path:     `/pagsusuri#pagsusuri-level-${i}`,
  })),

  { id: 'pagsusuri-layunin-section', title: 'Pagsusuri — Layunin ng Pagsusuri', body: 'Ang bawat gawain o ginagawa ng isang indibidwal o mag-aaral ay kinakailangang may tiyak na gampanin at layunin upang magkaroon ng direksyon at kabuluhan ang bawat hakbang na isinasagawa.', category: 'Pagsusuri', section: 'Layunin ng Pagsusuri', path: '/pagsusuri#pagsusuri-layunin-section' },

  // LAYUNIN items — point to the layunin section
  ...LAYUNIN.map(item => ({
    id:       `pagsusuri-layunin-${item.number}`,
    title:    `Pagsusuri — Layunin ${item.number}: ${item.label}`,
    body:     item.content,
    category: 'Pagsusuri',
    section:  'Layunin ng Pagsusuri',
    path:     `/pagsusuri#pagsusuri-layunin-section`,
  })),

  { id: 'pagsusuri-hakbang-section', title: 'Pagsusuri — Mga Hakbang sa Mabuting Pagsusuri', body: 'Mga Hakbang sa Mabuting Pagsusuri ng Akdang Pampanitikan. Sundan ang mga hakbang para sa isang komprehensibo at akademikong pagsusuri.', category: 'Pagsusuri', section: 'Mga Hakbang', path: '/pagsusuri#pagsusuri-hakbang-section' },

  // HAKBANG items — each gets its own anchor
  ...HAKBANG.map(step => ({
    id:       `pagsusuri-hakbang-${step.number}`,
    title:    `Pagsusuri — Hakbang ${step.number}: ${step.title}`,
    body:     step.content,
    category: 'Pagsusuri',
    section:  'Mga Hakbang sa Pagsusuri',
    path:     `/pagsusuri#pagsusuri-hakbang-${step.number}`,
  })),

  // ── BAGONG PAMANTAYAN ─────────────────────────────────────────────────────
  { id: 'bp-hero',     title: 'Bagong Pamantayan — Pamantayan sa Pagsusuri',   body: 'Bagong Pamantayan sa Pagsusuri ng Akdang Pampanitikan. Isang komprehensibong pamantayan na nagbibigay ng sistematiko at makabuluhang gabay.',                               category: 'Bagong Pamantayan', section: 'Hero',       path: '/bagong-pamantayan#bp-hero' },
  { id: 'bp-panimula', title: 'Bagong Pamantayan — Panimula',                  body: 'Sa patuloy na pagbabago ng panahon at pag-unlad ng edukasyon, kinakailangan ding paunlarin ang mga pamamaraang ginagamit sa pagsusuri ng akdang pampanitikan. Ang Bagong Pamantayan ay naglalayong magbigay ng mas komprehensibo, sistematiko, at makabuluhang gabay.', category: 'Bagong Pamantayan', section: 'Panimula',   path: '/bagong-pamantayan#bp-panimula' },

  // PAMANTAYAN cards — each gets its own anchor
  ...PAMANTAYAN_CARDS.map(card => ({
    id:       `bp-card-${card.numeral}`,
    title:    `Bagong Pamantayan — ${card.numeral}. ${card.title}`,
    body:     `${card.title}. ${card.items.join('. ')}`,
    category: 'Bagong Pamantayan',
    section:  'Mga Pamantayan sa Pagsusuri',
    path:     `/bagong-pamantayan#bp-card-${card.numeral}`,
  })),

  { id: 'bp-closing',           title: 'Bagong Pamantayan — Kabuuang Paglalarawan',             body: 'Ang pamantayang ito ay nahahati sa iba\'t ibang bahagi, mula sa panimulang impormasyon at pag-unawa sa akda, hanggang sa masusing tekstwal at kontekstwal na pagsusuri.',           category: 'Bagong Pamantayan', section: 'Kabuuan',              path: '/bagong-pamantayan#bp-cards-section' },
  { id: 'bp-rubric-nilalaman',  title: 'Bagong Pamantayan — Kalidad ng Nilalaman (Rubric)',     body: 'Rubric: Kalidad ng Nilalaman 20 puntos. Pagkilala sa Akda, Buod ng Akda, Pagkilala sa Uri ng Panitikan, Mga Tayutay, Kaugnay sa Konteksto.',                                      category: 'Bagong Pamantayan', section: 'Rubric A',             path: '/bagong-pamantayan#bp-rubric-nilalaman' },
  { id: 'bp-rubric-kritikal',   title: 'Bagong Pamantayan — Kritikal na Pagsusuri (Rubric)',    body: 'Rubric: Kritikal na Pagsusuri 20 puntos. Paglalapat ng Teoryang Pampanitikan, Istilo ng Paglalahad, Pagsusuri sa Tauhan, Banghay, Paggamit ng Ebidensya.',                       category: 'Bagong Pamantayan', section: 'Rubric B',             path: '/bagong-pamantayan#bp-rubric-kritikal' },
  { id: 'bp-rubric-organisasyon', title: 'Bagong Pamantayan — Organisasyon at Presentasyon',   body: 'Rubric: Organisasyon at Presentasyon 12 puntos. Organisasyon ng Papel, Lohikal na Daloy ng Ideya, Akademikong Wika.',                                                              category: 'Bagong Pamantayan', section: 'Rubric C',             path: '/bagong-pamantayan#bp-rubric-organisasyon' },
  { id: 'bp-rubric-mekaniks',   title: 'Bagong Pamantayan — Mekaniks at Citation (Rubric)',     body: 'Rubric: Mekaniks at Citation 12 puntos. Tamang Gramatika at Baybay, Paggamit ng Citation, Pormat ng Papel.',                                                                       category: 'Bagong Pamantayan', section: 'Rubric D',             path: '/bagong-pamantayan#bp-rubric-mekaniks' },
  { id: 'bp-rubric-kabuuan',    title: 'Bagong Pamantayan — Kabuuang Pagmamarka',               body: 'Kabuuang Pagmamarka. Kalidad ng Nilalaman 20 puntos. Kritikal na Pagsusuri 20 puntos. Organisasyon 12 puntos. Mekaniks 12 puntos.',                                              category: 'Bagong Pamantayan', section: 'Kabuuang Pagmamarka',  path: '/bagong-pamantayan#bp-kabuuan' },
  { id: 'bp-rubric-interpretasyon', title: 'Bagong Pamantayan — Interpretasyon ng Pagmamarka', body: 'Interpretasyon: 60-64 = Napakahusay 100. 54-59 = Mahusay 90. 48-53 = Katanggap-tanggap 85. 42-47 = Katamtaman 80. 40 pababa = Nangangailangan ng Pagpapabuti 75.',              category: 'Bagong Pamantayan', section: 'Interpretasyon',       path: '/bagong-pamantayan#bp-kabuuan' },

  // ── TEORYANG PAMPANITIKAN ─────────────────────────────────────────────────
  { id: 'teorya-page', title: 'Teoryang Pampanitikan — Mga Dulog Pampanitikan', body: 'Teoryang Pampanitikan at Mga Dulog Pampanitikan. Pag-aralan ang iba\'t ibang teorya sa pagsusuri ng panitikan tulad ng realismo, feminismo, historikal na pamamaraan.', category: 'Teoryang Pampanitikan', section: 'Pangunahing Pahina', path: '/teorya' },

  // ── TUNGKOL SA AMIN ───────────────────────────────────────────────────────
  { id: 'tsa-hero',          title: 'Tungkol Sa Amin — PANURI',                    body: 'Tungkol Sa Amin. Ang PANURI — Isang interaktibong kagamitang pantulong na gamit ang teknolohiya o website na naglalaman ng mga interbensyon.',                                       category: 'Tungkol Sa Amin', section: 'Hero',             path: '/tungkol-sa#tsa-hero' },
  { id: 'tsa-introduksyon',  title: 'Tungkol Sa Amin — Introduksyon',              body: 'Ang pagsusuri ay hindi lamang isang akademikong gawain kundi isang mahalagang kasanayan na humuhubog sa kritikal na pag-iisip. Ayon sa Seksyon 1 ng CMO Blg. 21, s. 2017, malinaw na itinakda ng CHED ang inaasahang kaalaman ng mga mag-aaral.', category: 'Tungkol Sa Amin', section: 'Introduksyon',     path: '/tungkol-sa#tsa-introduksyon' },
  { id: 'tsa-layunin',       title: 'Tungkol Sa Amin — Layunin',                   body: 'Layunin ng pananaliksik na makabuo ng isang istandard na pamantayan at kagamitang pantulong sa pagsusuri ng mga akdang pampanitikan upang mapaunlad ang kasanayan ng mga mag-aaral.',  category: 'Tungkol Sa Amin', section: 'Layunin',          path: '/tungkol-sa#tsa-layunin' },
  { id: 'tsa-metodolohiya',  title: 'Tungkol Sa Amin — Metodolohiya',              body: 'Metodolohiya ng pananaliksik: Talatanungan, Pagsusuri, Pagwawangis ng PANURI.',                                                                                                          category: 'Tungkol Sa Amin', section: 'Metodolohiya',     path: '/tungkol-sa#tsa-metodolohiya' },
  { id: 'tsa-natuklasan',    title: 'Tungkol Sa Amin — Mga Natuklasan',            body: 'Mga Natuklasan: Walang Istandard na Pamantayan sa Pagsusuri ng mga Akdang Pampanitikan sa asignaturang Panunuring Pampanitikan. Mahuhusay na ang mga mag-aaral ngunit may mga mungkahi pa.',  category: 'Tungkol Sa Amin', section: 'Mga Natuklasan',   path: '/tungkol-sa#tsa-natuklasan' },
  { id: 'tsa-tugon',         title: 'Tungkol Sa Amin — Tugon: PANURI',             body: 'PANURI. Isang interaktibong kagamitang pantulong na gamit ang teknolohiya o website na naglalaman ng mga interbensyon upang mapaunlad ang kasanayan sa pagsusuri ng mga akdang pampanitikan.', category: 'Tungkol Sa Amin', section: 'Tugon: PANURI',    path: '/tungkol-sa#tsa-tugon' },
  { id: 'tsa-team',          title: 'Tungkol Sa Amin — Koponan',                   body: 'Edwin R. Ichiano PhD (Tagapayo), Ryan S. Rodriguez PhD (Riserts Propesor), John Rey G. Trapalgar (May-Akda), Neziel D. Alvarez (May-Akda).',                                           category: 'Tungkol Sa Amin', section: 'Koponan',          path: '/tungkol-sa#tsa-team' },

  // ── PAGSUSULIT ────────────────────────────────────────────────────────────
  { id: 'pagsusulit-page', title: 'Pagsusulit — Mga Quiz at Pagsubok', body: 'Pagsusulit. Mga quiz at pagsubok para sa pagsusuri ng akdang pampanitikan. Multiple Choice, True/False, Essay.', category: 'Pagsusulit', section: 'Pangunahing Pahina', path: '/pagsusulit' },

  // ── PROFILE ───────────────────────────────────────────────────────────────
  { id: 'profile-page', title: 'Profile — Aking Impormasyon', body: 'Profile page. Tingnan at i-update ang iyong personal na impormasyon, mga natapos na quiz, at iba pa.', category: 'Profile', section: 'Pangunahing Pahina', path: '/profile' },
]

export default staticIndex
