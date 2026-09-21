import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WORKS_DATA } from '../../data/worksData';
import './WorksSection.css';

gsap.registerPlugin(ScrollTrigger);

export const WorksSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const strokePathRef = useRef<SVGPathElement>(null);
  const strokeSvgRef = useRef<SVGSVGElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const topImagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Inicialización e interacción del trazo verde
      if (strokePathRef.current) {
        const pathLength = strokePathRef.current.getTotalLength();

        // Ocultar la línea por completo al inicio
        gsap.set(strokePathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        // Animación progresiva de dibujado del trazo
        gsap.to(strokePathRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: '35% top',
            scrub: true,
          },
        });
      }

      // 2. Desvanecer la línea antes de cruzar la tarjeta de Mundo Infantil
      if (strokeSvgRef.current) {
        gsap.to(strokeSvgRef.current, {
          opacity: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: '15% top', // Comienza a desvanecer tempranamente
            end: '30% top',   // Se vuelve totalmente transparente antes de la tarjeta
            scrub: true,
          },
        });
      }

      // 3. Colapso de imágenes superiores
      gsap.to(topImagesRef.current, {
        height: 0,
        opacity: 0,
        marginBottom: 0,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '50% center',
          scrub: 1,
        },
      });

      // 4. Elevación de la Fila 2
      if (row2Ref.current) {
        gsap.to(row2Ref.current, {
          y: -140,
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '65% bottom',
            scrub: 1,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const row1Data = WORKS_DATA.slice(0, 2);
  const row2Data = WORKS_DATA.slice(2, 4);

  return (
    <section className="works-section" id="works" ref={sectionRef}>
      <div className="green-stroke-bg">
        <svg
          ref={strokeSvgRef}
          viewBox="0 0 500 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            ref={strokePathRef}
            d="M 380 -20 C 380 180, 220 220, 220 100 C 220 -20, 420 -10, 420 180 C 420 400, 150 500, 50 750"
            stroke="#00e676"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="works-container">
        <h2 className="works-title">MUNDOS</h2>

        <div className="works-stack">
          {/* Fila 1 */}
          <div className="works-row row-1">
            {row1Data.map((work, index) => (
              <div key={work.id} className="work-card">
                <div className="work-card-header">
                  <h3 className="work-card-title">{work.title}</h3>
                  <span className="work-card-badge">{work.countOrBadge}</span>
                </div>

                <p className="work-card-description">{work.description}</p>

                <div
                  className="work-card-image-wrapper"
                  ref={(el) => (topImagesRef.current[index] = el)}
                >
                  <img src={work.imageUrl} alt={work.title} loading="lazy" />
                </div>
              </div>
            ))}
          </div>

          {/* Fila 2 */}
          <div className="works-row row-2" ref={row2Ref}>
            {row2Data.map((work) => (
              <div key={work.id} className="work-card">
                <div className="work-card-header">
                  <h3 className="work-card-title">{work.title}</h3>
                  <span className="work-card-badge">{work.countOrBadge}</span>
                </div>

                <p className="work-card-description">{work.description}</p>

                <div className="work-card-image-wrapper">
                  <img src={work.imageUrl} alt={work.title} loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorksSection;