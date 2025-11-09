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
    const perfStart = performance.now();
    if (tokenGetter) {
      try {
        const tokenStart = performance.now();
        const token = await tokenGetter();
        const tokenTime = performance.now() - tokenStart;
        if (tokenTime > 10) {
          console.log(`[Performance] tokenProvider.getToken (from getter) took ${tokenTime}ms`);
        }
        return token;
      } catch (error) {
        const errorTime = performance.now() - perfStart;
        console.warn(`[Performance] tokenProvider.getToken failed after ${errorTime}ms:`, error);
      }
    }
    const totalTime = performance.now() - perfStart;
    if (totalTime > 1) {
      console.log(`[Performance] tokenProvider.getToken (cached) took ${totalTime}ms`);
    }
    return currentToken;
  },
};
