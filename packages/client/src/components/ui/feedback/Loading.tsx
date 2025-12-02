import React from 'react';
import { IconLoader } from '../Icons.js';

interface LoadingProps {
  variant?: 'full-page' | 'inline' | 'button';
  text?: string;
  className?: string;
}

export default function Loading({ variant = 'inline', text, className = '' }: LoadingProps) {
  const containerStyles = {
    'full-page': 'min-h-screen flex items-center justify-center',
    inline: 'flex items-center justify-center py-4',
    button: 'inline-flex items-center',
  };

  return (
    <div className={`${containerStyles[variant]} ${className}`}>
      <IconLoader className="w-5 h-5 animate-spin text-text-tertiary" />
      {text && <span className="ml-2 text-sm text-text-secondary">{text}</span>}
    </div>
  );
}
