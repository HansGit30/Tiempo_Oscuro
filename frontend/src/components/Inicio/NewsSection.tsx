import React from 'react';
import { NEWS_DATA } from '../../data/newsData';
import './NewsSection.css';

export const NewsSection: React.FC = () => {
  return (
    <section className="news-section" id="news">
      <div className="news-container">
        {/* Encabezado */}
        <div className="news-header">
          <h2 className="news-title">NOTICIAS</h2>
          <p className="news-description">
            Descubre las últimas novedades, eventos culturales y publicaciones de Tiempo Oscuro,<br />
            conectando a los lectores del Perú con el poder de la narrativa independiente.
          </p>
          <a href="#catalogo" className="news-see-details">
            Ver Detalle <span className="arrow">↗</span>
          </a>
        </div>

        {/* Grid de Noticias */}
        <div className="news-grid">
          {NEWS_DATA.map((item) => (
            <a 
              key={item.id} 
              href={item.link} 
              className="news-card"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="news-card-image-wrapper">
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
              </div>
              <div className="news-card-content">
                <h3 className="news-card-title">{item.title}</h3>
                <span className="news-card-date">{item.date}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;