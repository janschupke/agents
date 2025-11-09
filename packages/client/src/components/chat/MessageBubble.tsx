import { Message } from '../../types/chat.types.js';
import { IconSearch } from '../ui/Icons';

interface MessageBubbleProps {
  message: Message;
  onShowJson: (title: string, data: unknown) => void;
}

export default function MessageBubble({ message, onShowJson }: MessageBubbleProps) {
  const hasRawData =
    message.role === 'user' ? message.rawRequest !== undefined : message.rawResponse !== undefined;

  return (
    <div className={`flex max-w-[80%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
      <div
        className={`px-3 py-2 rounded-lg break-words text-sm relative group ${
          message.role === 'user'
            ? 'bg-message-user text-message-user-text'
            : 'bg-message-assistant text-message-assistant-text'
        }`}
      >
        <div className="pr-6">{message.content}</div>
        {hasRawData && (
          <button
            onClick={() => {
              if (message.role === 'user') {
                onShowJson('OpenAI Request', message.rawRequest);
              } else {
                onShowJson('OpenAI Response', message.rawResponse);
              }
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black hover:bg-opacity-10"
            title={message.role === 'user' ? 'View request JSON' : 'View response JSON'}
          >
            <IconSearch
              className={`w-3.5 h-3.5 ${
                message.role === 'user' ? 'text-message-user-text' : 'text-message-assistant-text'
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
