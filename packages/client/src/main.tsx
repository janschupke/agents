import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import ClerkTokenProvider from './components/auth/ClerkTokenProvider';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPubKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ClerkTokenProvider>
        <App />
      </ClerkTokenProvider>
    </ClerkProvider>
  </React.StrictMode>
);
