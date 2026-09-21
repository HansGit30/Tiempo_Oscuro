import { forwardRef } from 'react';
import { PosterCard } from './PosterCard';
import type { Poster } from '../../data/posterData';
import './PosterSlider.css';

interface PosterSliderProps {
  items: Poster[];
}

export const PosterSlider = forwardRef<HTMLDivElement, PosterSliderProps>(({ items }, ref) => {
  // Duplicamos el array para lograr el bucle infinito suave
  const doubleItems = [...items, ...items];

  return (
    <div className="slider-overflow-wrapper">
      <div className="slider-track" ref={ref}>
        {doubleItems.map((poster, index) => (
          <PosterCard key={`${poster.id}-${index}`} imageUrl={poster.imageUrl} title={poster.title} />
        ))}
      </div>
    </div>
  );
});

PosterSlider.displayName = 'PosterSlider';