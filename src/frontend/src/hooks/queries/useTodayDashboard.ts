import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import { useAppReadiness } from '../../context/AppReadinessContext';
import { useGetAllParties } from './useParties';
import type { Party, PartyId, PartyVisitRecord, PaymentId } from '../../backend';
import { timeToDate, isSameLocalDate } from '../../lib/time';

export interface TodayVisitEntry {
  paymentId: PaymentId;
  partyId: PartyId;
  partyName: string;
  partyPhone: string;
  record: PartyVisitRecord;
}

export function useTodayDashboard() {
  const { actor } = useActorSession();
  const { isAppReadyForMainData } = useAppReadiness();
  const { data: partiesData, isLoading: partiesLoading } = useGetAllParties();

  return useQuery<{
    visits: TodayVisitEntry[];
    count: number;
    totalAmount: bigint;
  }>({
    queryKey: ['todayDashboard'],
    queryFn: async () => {
      if (!actor || !partiesData) {
        return { visits: [], count: 0, totalAmount: BigInt(0) };
      }

      const today = new Date();
      const todayVisits: TodayVisitEntry[] = [];

      // Fetch visit records for all parties
      for (const [partyId, party] of partiesData) {
        try {
          const records = await actor.getPartyVisitRecords(partyId);
          
          for (const [paymentId, record] of records) {
            const visitDate = timeToDate(record.paymentDate);
            if (isSameLocalDate(visitDate, today)) {
              todayVisits.push({
                paymentId,
                partyId,
                partyName: party.name,
                partyPhone: party.phone,
                record,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching visits for party ${partyId}:`, error);
        }
      }

      // Sort by payment date (most recent first)
      todayVisits.sort((a, b) => {
        return Number(b.record.paymentDate - a.record.paymentDate);
      });

      // Calculate total amount
      const totalAmount = todayVisits.reduce(
        (sum, visit) => sum + visit.record.amount,
        BigInt(0)
      );

      return {
        visits: todayVisits,
        count: todayVisits.length,
        totalAmount,
      };
    },
    enabled: isAppReadyForMainData && !!actor && !!partiesData && !partiesLoading,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: false,
  });
}
