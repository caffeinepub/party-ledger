import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import { useAppReadiness } from '../../context/AppReadinessContext';
import type { VisitRecordMetadata, PaymentId, PartyId, Time, Location } from '../../backend';

export function useGetPayments(partyId: PartyId, options?: { enabled?: boolean }) {
  const { actor } = useActorSession();
  const { isAppReadyForMainData } = useAppReadiness();
  
  const enabled = options?.enabled !== undefined ? options.enabled : isAppReadyForMainData;

  return useQuery<Array<VisitRecordMetadata>>({
    queryKey: ['payments', partyId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPartyVisitRecordMetadata(partyId);
    },
    enabled: enabled && !!actor && !!partyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useRecordPayment() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      partyId: PartyId;
      amount: bigint;
      comment: string;
      paymentDate: Time;
      nextPayment: Time | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordPayment(
        params.partyId,
        params.amount,
        params.comment,
        params.paymentDate,
        params.nextPayment
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.partyId] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['todayDashboard'] });
    },
  });
}

export function useRecordPartyVisit() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      partyId: PartyId;
      amount: bigint;
      comment: string;
      paymentDate: Time;
      nextPayment: Time | null;
      location: Location | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordPartyVisit(
        params.partyId,
        params.amount,
        params.comment,
        params.paymentDate,
        params.nextPayment,
        params.location
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.partyId] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['todayDashboard'] });
    },
  });
}
