import { ReactNode } from 'react';

interface InfoFieldProps {
  label: string;
  value: string | ReactNode;
  className?: string;
}

/**
 * Read-only form field for displaying label + value pairs
 */
export default function InfoField({
  label,
  value,
  className = '',
}: InfoFieldProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <div className="mt-1 text-text-primary">
        {typeof value === 'string' ? (
          <p>{value}</p>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
