import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Skeleton } from './Skeleton';

export default function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <Skeleton className="h-8 w-24 rounded-md" />;
  }

  if (isSignedIn) {
    return null; // User dropdown handles sign out
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
