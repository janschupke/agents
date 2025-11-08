import { SignInButton, SignUpButton, SignOutButton, useUser } from '@clerk/clerk-react';

export default function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="px-4 py-2 text-text-secondary text-sm">Loading...</div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <SignOutButton>
          <button className="px-4 py-2 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="px-4 py-2 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-4 py-2 bg-primary text-text-inverse border-none rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
