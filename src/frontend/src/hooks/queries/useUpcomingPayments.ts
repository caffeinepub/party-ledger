import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';

export interface PartyWithNextPayment {
  partyId: string;
  partyName: string;
  partyPhone: string;
  nextPaymentDate: bigint;
}

export function useUpcomingPayments(selectedDate?: Date) {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<PartyWithNextPayment[]>({
    queryKey: ['upcomingPayments', selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!actor) {
        console.log('[UpcomingPayments] Actor not available');
        return [];
      }

      console.log('[UpcomingPayments] Fetching all parties with visit records...');
      const allPartiesWithVisits = await actor.getAllPartiesWithVisitRecords();
      console.log('[UpcomingPayments] Parties with visits fetched:', allPartiesWithVisits.length);

      // Use today if no date is selected
      const targetDate = selectedDate || new Date();
      targetDate.setHours(0, 0, 0, 0);
      const targetDateKey = targetDate.toISOString().split('T')[0];

      const partiesForDate: PartyWithNextPayment[] = [];

      for (const [partyId, party, visitRecords] of allPartiesWithVisits) {
        console.log(`[UpcomingPayments] Processing party: ${party.name} (${partyId})`);
        
        // Find the most recent visit with a next payment date
        let latestNextPaymentDate: bigint | null = null;
        
        for (const record of visitRecords) {
          if (record.nextPaymentDate !== undefined && record.nextPaymentDate !== null) {
            if (latestNextPaymentDate === null || record.nextPaymentDate > latestNextPaymentDate) {
              latestNextPaymentDate = record.nextPaymentDate;
            }
          }
        }

        if (latestNextPaymentDate !== null) {
          // Convert nanoseconds to milliseconds
          const dateMs = Number(latestNextPaymentDate / BigInt(1_000_000));
          const date = new Date(dateMs);
          date.setHours(0, 0, 0, 0);
          
          // Create a date key (YYYY-MM-DD) for comparison
          const dateKey = date.toISOString().split('T')[0];

          // Only include parties with payments due on the selected date
          if (dateKey === targetDateKey) {
            console.log(`[UpcomingPayments] Party ${party.name} has payment due on ${dateKey}`);
            partiesForDate.push({
              partyId,
              partyName: party.name,
              partyPhone: party.phone,
              nextPaymentDate: latestNextPaymentDate,
            });
          }
        }
      }

      console.log('[UpcomingPayments] Parties for date:', partiesForDate.length);
      // Sort by party name
      return partiesForDate.sort((a, b) => a.partyName.localeCompare(b.partyName));
    },
    enabled: !!actor && !actorLoading,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
