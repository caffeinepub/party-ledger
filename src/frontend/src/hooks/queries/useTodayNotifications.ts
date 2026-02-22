import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { PartyId, PartyVisitRecord } from '../../backend';

export interface PartyWithTodayPayments {
  partyId: PartyId;
  partyName: string;
  partyPhone: string;
  records: PartyVisitRecord[];
}

export function useTodayNotifications() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<PartyWithTodayPayments[]>({
    queryKey: ['todayNotifications'],
    queryFn: async () => {
      if (!actor) {
        console.log('[TodayNotifications] Actor not available');
        return [];
      }

      console.log('[TodayNotifications] Fetching parties with today due payments...');
      const rawNotifications = await actor.getPartiesWithTodayDuePayments();
      console.log('[TodayNotifications] Raw notifications received:', rawNotifications.length);

      // Fetch all parties to get names and phone numbers
      const allParties = await actor.getAllParties();
      console.log('[TodayNotifications] All parties fetched:', allParties.length);

      // Create a map for quick lookup
      const partyMap = new Map(allParties);

      // Transform notifications to include party details
      const enrichedNotifications: PartyWithTodayPayments[] = [];

      for (const [partyId, records] of rawNotifications) {
        const party = partyMap.get(partyId);
        
        if (!party) {
          console.warn(`[TodayNotifications] Party not found for ID: ${partyId}`);
          // Fallback: include with ID as name
          enrichedNotifications.push({
            partyId,
            partyName: partyId,
            partyPhone: '',
            records,
          });
        } else {
          console.log(`[TodayNotifications] Party found: ${party.name} (${partyId})`);
          enrichedNotifications.push({
            partyId,
            partyName: party.name,
            partyPhone: party.phone,
            records,
          });
        }
      }

      console.log('[TodayNotifications] Enriched notifications:', enrichedNotifications.length);
      return enrichedNotifications;
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 60 * 1000, // Refresh every minute
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  });
}
