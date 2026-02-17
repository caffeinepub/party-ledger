import { useInternetIdentity } from './useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_SAFE_QUERY_KEY = 'actorSafe';

export function useActorSafe() {
  const { identity } = useInternetIdentity();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_SAFE_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity
        }
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter('caffeineAdminToken') || '';
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    staleTime: Infinity,
    enabled: true,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    actor: actorQuery.data || null,
    isLoading: actorQuery.isLoading,
    isFetching: actorQuery.isFetching,
    isError: actorQuery.isError,
    error: actorQuery.error,
    refetch: actorQuery.refetch,
  };
}
