import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './teoryangPampanitikan.css';

// Reuse PDF.js from CDN to avoid bundle bloat (same as FlipBook)
let pdfjsLib = null;
async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = window['pdfjs-dist/build/pdf'];
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLib = lib;
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const PDF_URL = '/TABLE.pdf';
const SCALE = 1.2;
const THUMB_SCALE = 0.3;

export default function TeoryangPampanitikan() {
  const navigate = useNavigate();
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCache, setPagesCache] = useState({});
  const [thumbsCache, setThumbsCache] = useState({});
  const [loading, setLoading] = useState(true);

  const mainCanvasRef = useRef(null);

  // Load PDF document
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lib = await getPdfJs();
        const loadedPdf = await lib.getDocument({
          url: PDF_URL,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        }).promise;
        
        if (!active) return;
        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Render Main Page
  useEffect(() => {
    if (!pdf || !mainCanvasRef.current) return;
    
    let active = true;
    (async () => {
      // Use cached dataURL if available for instant load
      if (pagesCache[currentPage]) {
        const ctx = mainCanvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
          mainCanvasRef.current.width = img.width;
          mainCanvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = pagesCache[currentPage];
        return;
      }

      // Render fresh
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = mainCanvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        
        if (active) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPagesCache(prev => ({ ...prev, [currentPage]: dataUrl }));
          
          // Also generate thumbnail if missing
          if (!thumbsCache[currentPage]) {
            const thumbCanvas = document.createElement('canvas');
            const thumbViewport = page.getViewport({ scale: THUMB_SCALE });
            thumbCanvas.width = thumbViewport.width;
            thumbCanvas.height = thumbViewport.height;
            await page.render({ canvasContext: thumbCanvas.getContext('2d'), viewport: thumbViewport }).promise;
            setThumbsCache(prev => ({ ...prev, [currentPage]: thumbCanvas.toDataURL('image/jpeg', 0.5) }));
          }
        }
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    })();

    return () => { active = false; };
  }, [pdf, currentPage, pagesCache, thumbsCache]);

  // Pre-render thumbnails in background
  useEffect(() => {
    if (!pdf || totalPages === 0) return;
    let active = true;
    (async () => {
      for (let i = 1; i <= totalPages; i++) {
        if (!active) break;
        if (thumbsCache[i]) continue;
        
        try {
          const page = await pdf.getPage(i);
          const thumbViewport = page.getViewport({ scale: THUMB_SCALE });
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbViewport.width;
          thumbCanvas.height = thumbViewport.height;
          await page.render({ canvasContext: thumbCanvas.getContext('2d'), viewport: thumbViewport }).promise;
          
          if (active) {
            const thumbData = thumbCanvas.toDataURL('image/jpeg', 0.5);
            setThumbsCache(prev => ({ ...prev, [i]: thumbData }));
          }
          await new Promise(r => setTimeout(r, 200)); // slow down background rendering
        } catch(e) {}
      }
    })();
    return () => { active = false; };
  }, [pdf, totalPages, thumbsCache]);

  const goPrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const goNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Generate pagination dots
  const getDots = () => {
    let dots = [];
    // Show max 5 dots around current page
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      dots.push(
        <button 
          key={i} 
          className={`tp-dot ${i === currentPage ? 'tp-dot--active' : ''}`}
          onClick={() => setCurrentPage(i)}
          aria-label={`Page ${i}`}
        />
      );
    }
    return dots;
  };

  // Swipe Handlers for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance && currentPage < totalPages) {
      goNext();
    }
    if (distance < -minSwipeDistance && currentPage > 1) {
      goPrev();
    }
  };

  // Scroll sidebar active thumb into view
  useEffect(() => {
    const activeThumb = document.querySelector('.tp-thumb--active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  return (
    <main className="tp-page">
      {/* Optional absolute back button to avoid being trapped */}
    
      <div className="tp-container">
        
        {/* Top Header Box */}
        <div className="tp-header-box">
          <div 
            className="tp-header-progress" 
            style={{
              background: `linear-gradient(90deg, #d4a34b ${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%, #dcdcdc ${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%)`
            }}
          ></div>
          <div className="tp-header-content">
            <h2>TEORYANG PAMPANITIKAN/MGA DULOG PAMPANITIKAN</h2>
          </div>
        </div>  

        {/* Body Area */}
        <div className="tp-body-area">
          
          {/* Sidebar Box */}
          <aside className="tp-sidebar-box">
            <div className="tp-sidebar-scroll">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pNum = i + 1;
                return (
                  <div 
                    key={pNum} 
                    className={`tp-thumb-wrap ${currentPage === pNum ? 'tp-thumb--active' : ''}`}
                    onClick={() => setCurrentPage(pNum)}
                  >
                    {thumbsCache[pNum] ? (
                      <img src={thumbsCache[pNum]} alt={`Thumbnail ${pNum}`} className="tp-thumb-img" />
                    ) : (
                      <div className="tp-thumb-placeholder" />
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Column */}
          <div className="tp-right-col">
            
            {/* Main View Box */}
            <div 
              className="tp-main-box"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEndHandler}
            >
              {loading && <div className="tp-loading">Naglo-load ng PDF...</div>}
              <canvas ref={mainCanvasRef} className="tp-canvas" />
            </div>

            {/* Footer Box */}
            <div className="tp-footer-box">
              <button className="tp-nav-btn tp-nav-prev" onClick={goPrev} disabled={currentPage <= 1 || loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Previous
              </button>
              
              <div className="tp-pagination">
                <div className="tp-dots">
                  {getDots()}
                </div>
                <div className="tp-page-num">
                  {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                </div>
              </div>

              <button className="tp-nav-btn tp-nav-next" onClick={goNext} disabled={currentPage >= totalPages || loading}>
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}