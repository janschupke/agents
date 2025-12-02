interface ModalContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Reusable modal container component
 */
export default function ModalContainer({
  children,
  maxWidth = 'max-w-md',
  maxHeight = '',
  onClick,
}: ModalContainerProps) {
  return (
    <div
      className={`bg-background border border-border w-full ${maxWidth} ${maxHeight} flex flex-col m-4`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

