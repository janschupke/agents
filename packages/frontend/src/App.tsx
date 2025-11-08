import { useState } from 'react';
import ChatBot from './components/ChatBot';
import BotConfig from './components/BotConfig';

type View = 'chat' | 'config';

function App() {
  const [view, setView] = useState<View>('chat');

  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden">
      <header className="bg-background-secondary px-8 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-secondary">OpenAI Chat</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'chat'
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setView('config')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'config'
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
          >
            Bot Configuration
          </button>
        </div>
      </header>
      <main className="flex-1 flex justify-center items-start p-8 overflow-hidden">
        {view === 'chat' ? (
          <ChatBot botId={1} />
        ) : (
          <div className="w-full max-w-7xl h-full">
            <BotConfig />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
