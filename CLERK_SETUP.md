# Clerk Authentication Setup

This application uses Clerk for user authentication. This document describes the setup and configuration.

## Environment Variables

### Frontend (.env or .env.local)

Add the following environment variable:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

You can find your publishable key in the Clerk Dashboard under API Keys.

### Backend (.env)

Add the following environment variable:

```env
CLERK_SECRET_KEY=sk_test_...
```

You can find your secret key in the Clerk Dashboard under API Keys.

## Setup Steps

1. **Create a Clerk Account**
   - Go to https://clerk.com
   - Sign up for a free account
   - Create a new application

2. **Configure Environment Variables**
   - Add `VITE_CLERK_PUBLISHABLE_KEY` to your frontend `.env` file
   - Add `CLERK_SECRET_KEY` to your backend `.env` file

3. **Configure Clerk Application**
   - In the Clerk Dashboard, go to your application settings
   - Add your frontend URL (e.g., `http://localhost:3000`) to allowed origins
   - Configure authentication methods (email, OAuth, etc.) as needed

## Features

- **Sign Up**: Users can create new accounts
- **Sign In**: Existing users can sign in
- **Sign Out**: Authenticated users can sign out
- **Session Management**: Clerk handles session creation and management automatically
- **Token Verification**: Backend verifies Clerk session tokens on API requests

## Implementation Details

### Frontend

- `ClerkProvider` wraps the app in `main.tsx`
- `AuthButtons` component provides sign in/up/out UI
- API requests automatically include Clerk session tokens
- App shows different UI based on authentication state

### Backend

- `ClerkGuard` verifies session tokens (optional authentication)
- User info is attached to requests when token is valid
- Currently set to allow requests without authentication (for development)

## Notes

- Authentication is currently optional - requests work with or without tokens
- To require authentication, update `ClerkGuard` to throw `UnauthorizedException` when no token is provided
- User information is available in controllers via `request.user` when authenticated
