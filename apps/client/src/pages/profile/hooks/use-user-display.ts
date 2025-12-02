import { useUser } from '@clerk/clerk-react';
import { useUser as useUserQuery } from '../../../hooks/queries/use-user';
import { User } from '../../../types/chat.types';

interface UseUserDisplayReturn {
  displayUser: User;
  loadingUser: boolean;
}

/**
 * Merges Clerk user data with backend user data for display
 */
export function useUserDisplay(): UseUserDisplayReturn {
  const { user: clerkUser } = useUser();
  const { data: userInfo, isLoading: loadingUser } = useUserQuery();

  const displayUser = userInfo || {
    id: clerkUser?.id || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || null,
    firstName: clerkUser?.firstName || null,
    lastName: clerkUser?.lastName || null,
    imageUrl: clerkUser?.imageUrl || null,
    roles: [],
  };

  return {
    displayUser,
    loadingUser,
  };
}
