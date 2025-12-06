import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  wrapperClassName?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 0,
  className = '',
  wrapperClassName = '',
}: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const offset = position === 'top' ? 10 : 8;

      switch (position) {
        case 'top':
          setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - offset,
          });
          break;
        case 'bottom':
          setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + offset,
          });
          break;
        case 'left':
          setTooltipPosition({
            x: rect.left - offset,
            y: rect.top + rect.height / 2,
          });
          break;
        case 'right':
          setTooltipPosition({
            x: rect.right + offset,
            y: rect.top + rect.height / 2,
          });
          break;
      }
    }
  }, [showTooltip, position]);

  const handleMouseEnter = () => {
    if (delay > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    } else {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTransform = () => {
    switch (position) {
      case 'top':
        return 'translate(-50%, -100%)';
      case 'bottom':
        return 'translate(-50%, 0)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0, -50%)';
    }
  };


  const tooltipElement = showTooltip ? (
    <div
      className={`fixed z-50 px-3 py-2 text-xs text-text-inverse rounded shadow-lg pointer-events-none min-w-[120px] ${className}`}
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        transform: getTransform(),
        backgroundColor: 'rgb(var(--color-background-inverse))',
      }}
    >
      {content}
      {position === 'top' && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid rgb(var(--color-background-inverse))',
          }}
        />
      )}
      {position === 'bottom' && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2"
          style={{
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '4px solid rgb(var(--color-background-inverse))',
          }}
        />
      )}
      {position === 'left' && (
        <div
          className="absolute left-full top-1/2 transform -translate-y-1/2"
          style={{
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderLeft: '4px solid rgb(var(--color-background-inverse))',
          }}
        />
      )}
      {position === 'right' && (
        <div
          className="absolute right-full top-1/2 transform -translate-y-1/2"
          style={{
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '4px solid rgb(var(--color-background-inverse))',
          }}
        />
      )}
    </div>
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${wrapperClassName}`}
      >
        {children}
      </span>
      {tooltipElement &&
        typeof document !== 'undefined' &&
        createPortal(tooltipElement, document.body)}
    </>
  );
}
