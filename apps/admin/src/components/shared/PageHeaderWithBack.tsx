import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@openai/ui';
import { IconArrowLeft } from '../ui/Icons';

interface PageHeaderWithBackProps {
  title: string;
  backPath: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeaderWithBack({
  title,
  backPath,
  actions,
  className = '',
}: PageHeaderWithBackProps) {
  const navigate = useNavigate();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          variant="icon"
          size="sm"
          onClick={() => navigate(backPath)}
          tooltip="Back"
        >
          <IconArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold text-text-secondary">{title}</h2>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
