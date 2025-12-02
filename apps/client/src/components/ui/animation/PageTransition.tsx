import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FadeIn from './FadeIn';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wrapper component that applies fade-in animation when the route changes
 * Only fades in, no fade-out to avoid flickering
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Trigger fade-in when location changes by updating key
    setKey((prev) => prev + 1);
  }, [location.pathname]);

  return (
    <FadeIn key={key} className="w-full h-full">
      {children}
    </FadeIn>
  );
}
