import AgentSelector from '../../../config/components/agent/AgentSelector';

export default function ChatHeader() {
  return (
    <div className="px-5 py-3 bg-background border-b border-border">
      <AgentSelector />
    </div>
  );
}
