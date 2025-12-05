import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({
  title,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-medium text-text-secondary">{title}</h4>
      {children}
    </div>
  );
}
