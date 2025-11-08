// Token provider for Clerk session tokens
// This allows components to set tokens that services can access

let currentToken: string | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;

export const tokenProvider = {
  setTokenGetter(getter: () => Promise<string | null>) {
    tokenGetter = getter;
  },

  clearTokenGetter() {
    tokenGetter = null;
    currentToken = null;
  },

  setToken(token: string | null) {
    currentToken = token;
  },

  async getToken(): Promise<string | null> {
    if (tokenGetter) {
      try {
        return await tokenGetter();
      } catch (error) {
        console.warn('Failed to get token from getter:', error);
      }
    }
    return currentToken;
  },
};
