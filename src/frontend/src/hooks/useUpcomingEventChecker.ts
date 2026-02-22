import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../context/ActorSessionContext';
import { useNotifications } from '../context/NotificationContext';
import { useGetAllParties } from './queries/useParties';
import type { PartyId, PartyVisitRecord } from '../backend';

export function useUpcomingEventChecker() {
  const { actor, isLoading: actorLoading } = useActorSession();
  const { addNotification } = useNotifications();
  const { data: parties = [] } = useGetAllParties();

  const { data: upcomingPayments } = useQuery<Array<[PartyId, PartyVisitRecord[]]>>({
    queryKey: ['upcomingPayments'],
    queryFn: async () => {
      if (!actor) return [];
      
      const now = Date.now();
      const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000;
      
      const allPartiesWithVisits = await actor.getAllPartiesWithVisitRecords();
      
      const upcoming: Array<[PartyId, PartyVisitRecord[]]> = [];
      
      for (const [partyId, _, visitRecords] of allPartiesWithVisits) {
        const upcomingRecords = visitRecords.filter((record) => {
          if (!record.nextPaymentDate) return false;
          const nextPaymentTime = Number(record.nextPaymentDate) / 1000000;
          return nextPaymentTime >= now && nextPaymentTime <= twentyFourHoursFromNow;
        });
        
        if (upcomingRecords.length > 0) {
          upcoming.push([partyId, upcomingRecords]);
        }
      }
      
      return upcoming;
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!upcomingPayments || upcomingPayments.length === 0) return;

    upcomingPayments.forEach(([partyId, records]) => {
      const party = parties.find(([id]) => id === partyId)?.[1];
      if (!party) return;

      records.forEach((record) => {
        if (record.nextPaymentDate) {
          addNotification({
            type: 'upcoming',
            partyId,
            partyName: party.name,
            message: `Payment due within 24 hours for ${party.name}`,
          });
        }
      });
    });
  }, [upcomingPayments, parties, addNotification]);
}
