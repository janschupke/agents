import { ReactNode } from 'react';
import { Card } from '@openai/ui';

interface DetailCardProps {
  title: string;
  children: ReactNode;
  gridCols?: number;
  className?: string;
}

export default function DetailCard({
  title,
  children,
  gridCols,
  className = '',
}: DetailCardProps) {
  return (
    <Card title={title} padding="md" className={className}>
      {gridCols ? (
        <div className={`grid grid-cols-${gridCols} gap-4 text-sm`}>
          {children}
        </div>
      ) : (
        <div className="space-y-3 text-sm">{children}</div>
      )}
    </Card>
  );
}
