import React from 'react';
import './PosterCard.css';

interface PosterCardProps {
  imageUrl: string;
  title: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({ imageUrl, title }) => {
  return (
    <div className="poster-card">
      <img src={imageUrl} alt={title} loading="lazy" />
    </div>
  );
};