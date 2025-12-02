// Token provider for Clerk session tokens
// This allows components to set tokens that services can access

let currentToken: string | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;
let isReady = false;
let readyCallbacks: Array<() => void> = [];

export const tokenProvider = {
  setTokenGetter(getter: () => Promise<string | null>) {
    tokenGetter = getter;
    isReady = true;
    // Notify all waiting callbacks
    readyCallbacks.forEach(callback => callback());
    readyCallbacks = [];
  },

  clearTokenGetter() {
    tokenGetter = null;
    currentToken = null;
    isReady = false;
    readyCallbacks = [];
  },

  setToken(token: string | null) {
    currentToken = token;
  },

  isReady(): boolean {
    return isReady;
  },

  waitForReady(): Promise<void> {
    if (isReady) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      readyCallbacks.push(resolve);
    });
  },

  async getToken(): Promise<string | null> {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        return token;
      } catch (error) {
        console.warn('tokenProvider.getToken failed:', error);
      }
    }
    return currentToken;
  },
};
