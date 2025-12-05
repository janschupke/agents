import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useTokenReady } from '../../../hooks/use-token-ready';
import { UserService } from '../../../services/user.service';
import { User } from '../../../types/user.types';
import { queryKeys } from '../../../hooks/queries/query-keys';

export function useCurrentUser() {
  const { isSignedIn, isLoaded } = useUser();
  const tokenReady = useTokenReady();

  return useQuery<User>({
    queryKey: queryKeys.user.me(),
    queryFn: () => UserService.getCurrentUser(),
    enabled: isSignedIn && isLoaded && tokenReady,
  });
}

export function useUsers() {
  const { isSignedIn, isLoaded } = useUser();
  const tokenReady = useTokenReady();

  return useQuery<User[]>({
    queryKey: queryKeys.user.list(),
    queryFn: () => UserService.getAllUsers(),
    enabled: isSignedIn && isLoaded && tokenReady,
  });
}
