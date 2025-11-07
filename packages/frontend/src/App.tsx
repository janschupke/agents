import { useState, useEffect } from 'react';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>OpenAI Chat</h1>
      </header>
      <main className="app-main">
        <ChatBot botId={1} />
      </main>
    </div>
  );
}

export default App;
