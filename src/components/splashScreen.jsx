import { useEffect, useRef, useState } from 'react';
import './splashScreen.css';

export default function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fade = setTimeout(() => setFadeOut(true), 2000);
    return () => clearTimeout(fade);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x:            Math.random() * canvas.width,
      y:            Math.random() * canvas.height,
      r:            Math.random() * 1.3 + 0.25,
      alpha:        Math.random() * 0.16 + 0.03,
      vx:           (Math.random() - 0.5) * 0.12,
      vy:           (Math.random() - 0.5) * 0.08 - 0.05,
      flicker:      Math.random() * Math.PI * 2,
      flickerSpeed: 0.005 + Math.random() * 0.012,
      warmth:       Math.random(),
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.flicker += p.flickerSpeed;
        const fade = 0.7 + 0.3 * Math.sin(p.flicker);
        const a    = p.alpha * fade;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -2)  p.x = W + 2;
        if (p.x > W+2) p.x = -2;
        if (p.y < -2)  p.y = H + 2;
        if (p.y > H+2) p.y = -2;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`splash-container ${fadeOut ? 'fade-out' : ''}`}>

      <canvas ref={canvasRef} className="splash-dust" />

      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img
            src="/splash_screen.jpeg"
            alt="Logo"
            className="splash-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="splash-shadow" />

        <h1 className="splash-title">PANURI</h1>
        <p className="splash-subtitle">Naglo-load...</p>

        <div className="splash-spinner" />
      </div>

    </div>
  );
}