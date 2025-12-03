import AgentSelector from '../../agent/AgentSelector/AgentSelector';

export default function ChatHeader() {
  return (
    <div className="px-5 py-3 bg-background border-b border-border">
      <AgentSelector />
    </div>
  );
}
