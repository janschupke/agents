import ModalBackdrop from '../components/ModalBackdrop';
import ModalContainer from '../components/ModalContainer';
import ModalHeader from '../components/ModalHeader';
import ModalContent from '../components/ModalContent';
import ModalFooter from '../components/ModalFooter';
import { FormButton } from '../../form';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
}

/**
 * Modal for displaying JSON data
 */
export default function JsonModal({
  isOpen,
  onClose,
  title,
  data,
}: JsonModalProps) {
  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalContainer
        maxWidth="max-w-4xl"
        maxHeight="max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader title={title} onClose={onClose} />
        <ModalContent className="flex-1 overflow-auto">
          <pre className="text-xs text-text-primary font-mono bg-background p-4 rounded border border-border whitespace-pre-wrap break-words">
            {jsonString}
          </pre>
        </ModalContent>
        <ModalFooter>
          <FormButton type="button" onClick={onClose} variant="primary">
            Close
          </FormButton>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
