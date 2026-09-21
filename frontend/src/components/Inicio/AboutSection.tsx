import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './AboutSection.css';

gsap.registerPlugin(ScrollTrigger);

export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const strokeContainerRef = useRef<HTMLDivElement>(null);
  const strokePathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (strokePathRef.current && strokeContainerRef.current) {
        const pathLength = strokePathRef.current.getTotalLength();

        gsap.set(strokePathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.set(strokeContainerRef.current, { opacity: 0 });

        // 1. Dibujado de la línea con el scroll
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'bottom 40%',
            scrub: 1,
          },
        });

        tl.to(strokeContainerRef.current, { opacity: 1, duration: 0.1 })
          .to(strokePathRef.current, { strokeDashoffset: 0, ease: 'none' }, '<');

        // 2. Desvanecer la línea antes de tocar la sección #news
        gsap.to(strokeContainerRef.current, {
          opacity: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: '#news',
            start: 'top 90%', // Empieza a borrarse justo cuando asoma la sección NEWS
            end: 'top 65%',   // Desaparece por completo antes del contenido
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about-section" id="about" ref={sectionRef}>
      {/* Contenedor del trazo curvo en el lateral izquierdo */}
      <div className="green-stroke-left" ref={strokeContainerRef}>
        <svg
          viewBox="0 0 300 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            ref={strokePathRef}
            d="M 280 -50 C 50 200, 50 600, 280 850"
            stroke="#00e676"
            strokeWidth="40" /* Ajustado de 50 a 16 para que se vea elegante y delgado */
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="about-container">
        {/* Información general de la librería */}
        <div className="about-content">
          <h2 className="about-title">NOSOTROS</h2>
          <p className="about-description">
            Desde Perú, Tiempo Oscuro conecta a los lectores con las obras más impactantes 
            de la literatura contemporánea, narrativa oscura y títulos independientes. 
            Difundimos historias inolvidables en todo el país.
          </p>
          <a href="#catalogo" className="about-link">
            Ver Catálogo ↗
          </a>
        </div>

        {/* Cronología de hitos y eventos */}
        <div className="about-timeline">
          <div className="timeline-group">
            <h3 className="timeline-year">2026</h3>
            <div className="timeline-item">
              <span className="timeline-month">07</span>
              <p className="timeline-text">
                Premio a la Mejor Edición Independiente en la Feria Internacional del Libro de Lima (FIL Lima)
              </p>
            </div>
          </div>

          <div className="timeline-group">
            <h3 className="timeline-year">2025</h3>
            <div className="timeline-item">
              <span className="timeline-month">01</span>
              <p className="timeline-text">
                Lanzamiento de la colección exclusiva de narrativa peruana contemporánea
              </p>
            </div>
            <div className="timeline-item">
              <span className="timeline-month">06</span>
              <p className="timeline-text">
                Expansión del catálogo digital con envíos a nivel nacional
              </p>
            </div>
            <div className="timeline-item">
              <span className="timeline-month">07</span>
              <p className="timeline-text">
                Participación destacada en el encuentro nacional de librerías independientes
              </p>
            </div>
            <div className="timeline-item">
              <span className="timeline-month">11</span>
              <p className="timeline-text">
                Reconocimiento a la gestión cultural y fomento de la lectura
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;