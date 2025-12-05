import ModalFooter from '../components/ModalFooter';

interface DialogFooterProps {
  children: React.ReactNode;
}

/**
 * Dialog footer component
 */
export default function DialogFooter({ children }: DialogFooterProps) {
  return <ModalFooter>{children}</ModalFooter>;
}
