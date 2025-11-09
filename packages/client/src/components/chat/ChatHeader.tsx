import BotSelector from '../bot/BotSelector';

export default function ChatHeader() {
  return (
    <div className="px-5 py-3 bg-background border-b border-border flex items-center justify-between">
      <BotSelector />
    </div>
  );
}
