import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { PartyId, PartyVisitRecord } from '../../backend';

export function useTodayNotifications() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<Array<[PartyId, Array<PartyVisitRecord>]>>({
    queryKey: ['todayNotifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPartiesWithTodayDuePayments();
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 60 * 1000, // Refresh every minute
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  });
}
