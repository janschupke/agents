import { ReactNode } from 'react';

interface FormContainerProps {
  children: ReactNode;
  saving?: boolean;
  error?: string | null;
  className?: string;
}

export default function FormContainer({
  children,
  saving = false,
  error,
  className = '',
}: FormContainerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>{children}</div>
    </div>
  );
}
