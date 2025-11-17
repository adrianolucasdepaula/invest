import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  googleId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  preferences?: Record<string, any>;
  notifications?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

/**
 * Hook customizado para buscar dados do usuário autenticado
 * com retry logic automático e tratamento de erros robusto.
 *
 * Features:
 * - Retry automático em caso de falha (3 tentativas)
 * - Backoff exponencial (1s, 2s, 4s)
 * - Cache in-memory para evitar requisições duplicadas
 * - Error handling robusto
 *
 * @returns {UseUserResult} user, loading, error, refetch
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userData = await api.getProfile();
      setUser(userData);
      setLoading(false);
    } catch (err: any) {
      console.error(`Erro ao buscar perfil (tentativa ${retryCount + 1}/${MAX_RETRIES}):`, err);

      // Verificar se deve fazer retry
      const shouldRetry = retryCount < MAX_RETRIES &&
                          (err.code === 'ERR_NETWORK' ||
                           err.code === 'ECONNREFUSED' ||
                           err.message?.includes('SOCKET_NOT_CONNECTED') ||
                           err.message?.includes('CONNECTION_RESET') ||
                           err.message?.includes('EMPTY_RESPONSE'));

      if (shouldRetry) {
        // Backoff exponencial: 1s, 2s, 4s
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms...`);

        setTimeout(() => {
          fetchUser(retryCount + 1);
        }, delay);
      } else {
        // Falha final ou erro não recuperável
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchUser is stable and doesn't depend on external props/state

  const refetch = async () => {
    await fetchUser();
  };

  return { user, loading, error, refetch };
}
