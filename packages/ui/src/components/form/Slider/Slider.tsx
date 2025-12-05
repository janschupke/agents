import { ReactNode } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  label?: string | ReactNode;
  labelFor?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  labels?: {
    min?: string;
    mid?: string;
    max?: string;
  };
  className?: string;
}

/**
 * Generic slider component for numeric inputs with visual feedback
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  id,
  label,
  labelFor,
  hint,
  error,
  disabled = false,
  showValue = true,
  valueFormatter = (val) => val.toString(),
  labels,
  className = '',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={labelFor || id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {showValue && (
            <span className="font-mono ml-2 text-text-primary">
              {valueFormatter(value)}
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          id={id || labelFor}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${percentage}%, rgb(var(--color-border)) ${percentage}%, rgb(var(--color-border)) 100%)`,
          }}
        />
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          {labels.min && <span>{labels.min}</span>}
          {labels.mid && <span className="mx-auto">{labels.mid}</span>}
          {labels.max && <span className="ml-auto">{labels.max}</span>}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}
