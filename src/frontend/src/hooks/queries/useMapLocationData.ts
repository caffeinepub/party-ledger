import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';

export interface MapLocationData {
  partyId: string;
  partyName: string;
  address: string;
  latitude: number;
  longitude: number;
  visitCount: number;
}

export function useMapLocationData() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<MapLocationData[]>({
    queryKey: ['mapLocationData'],
    queryFn: async () => {
      if (!actor) return [];

      const allPartiesWithVisits = await actor.getAllPartiesWithVisitRecords();

      const locationData: MapLocationData[] = [];

      for (const [partyId, party, visitRecords] of allPartiesWithVisits) {
        // Filter visits that have location data
        const visitsWithLocation = visitRecords.filter((visit) => visit.location !== undefined && visit.location !== null);

        if (visitsWithLocation.length > 0) {
          // Use the most recent visit's location (last in array)
          const latestVisitWithLocation = visitsWithLocation[visitsWithLocation.length - 1];
          
          if (latestVisitWithLocation.location) {
            locationData.push({
              partyId,
              partyName: party.name,
              address: party.address,
              latitude: latestVisitWithLocation.location.latitude,
              longitude: latestVisitWithLocation.location.longitude,
              visitCount: visitsWithLocation.length,
            });
          }
        }
      }

      return locationData;
    },
    enabled: !!actor && !actorLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
