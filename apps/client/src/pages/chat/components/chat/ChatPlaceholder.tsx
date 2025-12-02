import { IconChat } from '../../../../components/ui/Icons';

export default function ChatPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <IconChat className="w-24 h-24 text-text-tertiary mb-4 mx-auto" />
        <p className="text-text-secondary mb-2">
          Select a session to start chatting
        </p>
        <p className="text-sm text-text-tertiary">
          Choose a session from the sidebar or create a new one
        </p>
      </div>
    </div>
  );
}
