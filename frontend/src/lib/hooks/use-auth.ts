import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.getProfile(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
