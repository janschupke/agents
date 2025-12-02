/**
 * Generic Alert component for displaying error, success, and info messages
 */

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  className?: string;
}

const typeStyles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

function Alert({ type, message, className = '' }: AlertProps) {
  return (
    <div
      className={`px-4 py-3 rounded-md border text-sm ${typeStyles[type]} ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
