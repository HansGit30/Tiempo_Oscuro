import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Barra superior de avisos/noticias */}
      <div className="footer-notice-bar">
        <div className="footer-notice-container">
          <div className="notice-left">
            <span className="notice-badge">NOTICE</span>
            <span className="notice-text">
              El catálogo digital de Tiempo Oscuro ya se encuentra disponible para envíos a nivel nacional.
            </span>
          </div>
          <span className="notice-date">2026.08.28</span>
        </div>
      </div>

      {/* Contenido principal del footer */}
      <div className="footer-body">
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="separator">|</span>
          <a href="#ethics">Corporate Ethics Center</a>
        </div>
        <p className="footer-copyright">
          © 2026 Tiempo Oscuro Corp. All Rights Reserved
        </p>
      </div>

      {/* Marquesina gigante en la base (Texto infinito) */}
      <div className="footer-marquee">
        <div className="marquee-track">
          <span>TIEMPO OSCURO</span>
          <span>TIEMPO OSCURO</span>
          <span>TIEMPO OSCURO</span>
          <span>TIEMPO OSCURO</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;