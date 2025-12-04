import { ReactNode } from 'react';

interface CardFlipProps {
  isFlipped: boolean;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

/**
 * Card flip animation component
 * Provides a 3D flip animation between front and back content
 */
export default function CardFlip({
  isFlipped,
  front,
  back,
  className = '',
}: CardFlipProps) {
  return (
    <div className={`card-flip-container ${className}`}>
      <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="card-flip-front">{front}</div>
        <div className="card-flip-back">{back}</div>
      </div>
    </div>
  );
}
