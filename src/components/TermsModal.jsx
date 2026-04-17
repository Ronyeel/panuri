import React from 'react';
import './TermsModal.css';

export default function TermsModal({ type, onClose }) {
  const isPrivacy = type === 'privacy';
  
  const title = isPrivacy ? 'Privacy Policy' : 'User Terms and Conditions';

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="terms-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        
        <h2 className="terms-modal-title">{title}</h2>
        
        <div className="terms-modal-body">
          {isPrivacy ? (
            <>
              <h3>1. Impormasyong Kinokolekta Namin</h3>
              <p>
                Ang PANURI ay nangongolekta ng personal na impormasyon tulad ng iyong pangalan, email address, at papel (guro, estudyante, atbp.) na ibinibigay mo kapag nagparehistro ka. Kinokolekta rin namin ang data ng paggamit upang mapabuti ang aming mga serbisyo.
              </p>
              
              <h3>2. Paano Namin Ginagamit ang Iyong Impormasyon</h3>
              <p>
                Ginagamit namin ang impormasyong kinokolekta namin upang magbigay, mapanatili, at mapabuti ang platform ng PANURI, upang makipag-usap sa iyo, at upang magbigay ng suporta sa customer.
              </p>
              
              <h3>3. Pagbabahagi at Pagbubunyag</h3>
              <p>
                Hindi namin ibinebenta ang iyong personal na impormasyon. Maaari kaming magbahagi ng impormasyon sa mga pinagkakatiwalaang third-party na service provider na tumutulong sa amin sa pagpapatakbo ng aming website.
              </p>
              
              <h3>4. Seguridad ng Data</h3>
              <p>
                Gumagawa kami ng mga makatwirang hakbang upang maprotektahan ang iyong personal na impormasyon mula sa hindi awtorisadong pag-access, pag-alter, o pagkasira.
              </p>
              
              <h3>5. Iyong Mga Karapatan</h3>
              <p>
                May karapatan kang i-access, itama, o tanggalin ang iyong personal na impormasyon sa pamamagitan ng iyong mga setting ng account.
              </p>
            </>
          ) : (
            <>
              <h3>1. Pagtanggap sa mga Tuntunin</h3>
              <p>
                Sa pag-access at paggamit ng PANURI, sumasang-ayon ka na sumunod sa at sumailalim sa mga Tuntunin at Kundisyon na ito. Kung hindi ka sumasang-ayon sa alinmang bahagi ng mga tuntuning ito, mangyaring huwag gamitin ang aming serbisyo.
              </p>
              
              <h3>2. Account ng User</h3>
              <p>
                Ikaw ay may pananagutan sa pagpapanatili ng pagiging kumpidensyal ng iyong account at password, at para sa paghihigpit sa pag-access sa iyong computer. Sumasang-ayon kang tanggapin ang responsibilidad para sa lahat ng aktibidad na nagaganap sa ilalim ng iyong account.
              </p>
              
              <h3>3. Code of Conduct</h3>
              <p>
                Inaasahan ang lahat ng user na mapanatili ang isang magalang at propesyonal na kapaligiran. Anumang uri ng panliligalig, hate speech, o mapanirang pag-uugali ay hindi pinahihintulutan at maaaring magresulta sa pagsususpinde ng account.
              </p>
              
              <h3>4. Intelektwal na Ari-arian</h3>
              <p>
                Ang lahat ng nilalaman na ibinigay sa PANURI, kabilang ngunit hindi limitado sa mga teksto, graphics, at mga pamantayan sa pagsusuri, ay pag-aari ng PANURI at protektado ng mga batas sa copyright.
              </p>
              
              <h3>5. Limitasyon ng Pananagutan</h3>
              <p>
                Ang PANURI ay hindi mananagot para sa anumang direkta, hindi direkta, incidental, o kinahinatnang mga pinsala na nagmumula sa iyong paggamit o kawalan ng kakayahang gamitin ang aming plataporma.
              </p>
            </>
          )}
        </div>
        
        <div className="terms-modal-footer">
          <button className="terms-modal-btn" onClick={onClose}>
            Naiintindihan ko
          </button>
        </div>
      </div>
    </div>
  );
}
