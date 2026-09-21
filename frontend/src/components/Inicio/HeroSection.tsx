import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from './Navbar';
import { PosterSlider } from './PosterSlider';
import { POSTERS_DATA } from '../../data/posterData';
import './HeroSection.css';

gsap.registerPlugin(ScrollTrigger);

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=250%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1. Escalar y mover todo el bloque de texto hacia arriba
      timeline.to(
        textContainerRef.current,
        {
          scale: 0.55,
          y: -40,
          ease: 'power1.inOut',
          duration: 1,
        },
        0
      );

      // 2. Revelar subtítulo justo debajo del título reducido
      timeline.to(
        subtextRef.current,
        {
          opacity: 1,
          y: -5,
          ease: 'power1.out',
          duration: 0.8,
        },
        0.5
      );

      // 3. Subir el slider abajo del bloque de texto
      timeline.to(
        sliderContainerRef.current,
        {
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          duration: 1,
        },
        1
      );

      // 4. Desplazamiento horizontal del carrusel
      timeline.to(
        sliderTrackRef.current,
        {
          x: '-50%',
          ease: 'none',
          duration: 2,
        },
        1.5
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero-wrapper" ref={heroRef}>
      <Navbar />
      <div className="hero-sticky">
        
        {/* Título y Subtítulo integrados */}
        <div className="hero-text-container" ref={textContainerRef}>
          <h1 className="hero-main-title">
            HISTORIAS QUE DEJAN<br />HUELLA
          </h1>
          <p className="hero-subtext" ref={subtextRef}>
            Tiempo Oscuro fue fundada con el propósito de difundir historias fascinantes 
          a través de la narrativa contemporánea, el suspenso y las ediciones independientes en Perú.
          </p>
        </div>

        {/* Slider ubicado debajo sin solaparse */}
        <div className="slider-animation-wrapper" ref={sliderContainerRef}>
          <PosterSlider items={POSTERS_DATA} ref={sliderTrackRef} />
        </div>

        <div className="scroll-indicator">
          <div className="circle-dot"></div>
          <span>SCROLL</span>
        </div>
      </div>
    </div>
  );
};