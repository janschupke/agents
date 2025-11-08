import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background-secondary px-8 py-4 shadow-md">
        <h1 className="text-2xl font-semibold text-text-secondary">OpenAI Chat</h1>
      </header>
      <main className="flex-1 flex justify-center items-start p-8">
        <ChatBot botId={1} />
      </main>
    </div>
  );
}

export default App;
