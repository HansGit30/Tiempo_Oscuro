import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { HeroSection } from '../components/Inicio/HeroSection';
import WorksSection from '../components/Inicio/WorksSection';
import AboutSection from '../components/Inicio/AboutSection';
import NewsSection from '../components/Inicio/NewsSection';
import Footer from '../components/Inicio/Footer';


export const App: React.FC = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <main className="app-container">
      <HeroSection />
      <WorksSection />
      <AboutSection />
      <NewsSection />
      <Footer />
    </main>
  );
};

export default App;