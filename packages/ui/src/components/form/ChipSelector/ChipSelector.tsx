import { ReactNode } from 'react';

export interface ChipSelectorProps {
  options: readonly string[] | string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  id?: string;
  label?: string | ReactNode;
  labelFor?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  chipClassName?: string;
  columns?: number;
  renderOption?: (option: string, isSelected: boolean) => ReactNode;
}

/**
 * Generic chip selector component for multi-select options
 * Displays options as toggleable chips/buttons
 */
export default function ChipSelector({
  options,
  selected,
  onChange,
  id,
  label,
  labelFor,
  hint,
  error,
  disabled = false,
  className = '',
  chipClassName = '',
  columns,
  renderOption,
}: ChipSelectorProps) {
  const toggleOption = (option: string) => {
    if (disabled) return;

    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const getLayoutClass = () => {
    if (columns) {
      const colsMap: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        7: 'grid-cols-7',
        8: 'grid-cols-8',
        9: 'grid-cols-9',
        10: 'grid-cols-10',
        11: 'grid-cols-11',
        12: 'grid-cols-12',
      };
      return `grid ${colsMap[columns] || 'grid-cols-4'} gap-2`;
    }
    // Use CSS Grid with auto-fit for responsive layout that adapts to available space
    // Automatically adjusts number of columns based on container width
    return 'grid gap-2';
  };

  const getGridStyle = () => {
    if (!columns) {
      // Use auto-fit with minmax to create responsive columns
      // minmax(120px, 1fr) ensures minimum width of 120px and allows growth
      return { gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' };
    }
    return undefined;
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={labelFor || id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className={getLayoutClass()} style={getGridStyle()}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                columns ? '' : 'min-w-[120px]'
              } ${
                isSelected
                  ? 'bg-primary text-text-inverse border-primary hover:bg-primary-hover'
                  : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
              } ${chipClassName}`}
            >
              {renderOption ? renderOption(option, isSelected) : option}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-text-tertiary mt-1">{hint}</p>
      )}
    </div>
  );
}
