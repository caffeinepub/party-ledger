import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import { useInternetIdentity } from '../useInternetIdentity';
import type { Time } from '../../backend';

export interface MapLocationData {
  partyId: string;
  partyName: string;
  address: string;
  latitude: number;
  longitude: number;
  visitCount: number;
}

export function useMapLocationData(startDate?: Time | null, endDate?: Time | null) {
  const { actor, isLoading: actorLoading } = useActorSession();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<MapLocationData[]>({
    queryKey: ['mapLocationData', startDate?.toString(), endDate?.toString()],
    queryFn: async () => {
      console.log('[useMapLocationData] Starting query', {
        hasActor: !!actor,
        isAuthenticated,
        startDate: startDate?.toString(),
        endDate: endDate?.toString(),
      });

      if (!actor) {
        console.error('[useMapLocationData] Actor not available');
        throw new Error('Actor not available');
      }

      if (!isAuthenticated) {
        console.error('[useMapLocationData] User not authenticated');
        throw new Error('Authentication required to view map data');
      }

      try {
        // Use getPartiesWithVisits with date filtering and location requirement
        console.log('[useMapLocationData] Calling getPartiesWithVisits with date filters and includeLocation=true');
        const partiesWithVisits = await actor.getPartiesWithVisits(
          startDate || null,
          endDate || null,
          true // includeLocation - only return visits with location data
        );

        console.log('[useMapLocationData] Raw response:', {
          partiesCount: partiesWithVisits.length,
          parties: partiesWithVisits.map(([id, visits]) => ({
            id,
            visitCount: visits.length,
          })),
        });

        const locationData: MapLocationData[] = [];

        // Get party details for each party with visits
        for (const [partyId, visitRecords] of partiesWithVisits) {
          console.log(`[useMapLocationData] Processing party ${partyId}:`, {
            visitCount: visitRecords.length,
          });

          if (visitRecords.length === 0) {
            console.warn(`[useMapLocationData] Party ${partyId} has no visit records`);
            continue;
          }

          // Get party details
          const partyDetails = await actor.getParty(partyId);
          if (!partyDetails) {
            console.warn(`[useMapLocationData] Party details not found for ${partyId}`);
            continue;
          }

          // Filter visits that have location data (should already be filtered by backend)
          const visitsWithLocation = visitRecords.filter((visit) => {
            const hasLocation = visit.location !== undefined && visit.location !== null;
            if (!hasLocation) {
              console.warn(`[useMapLocationData] Visit without location for party ${partyId}`);
            }
            return hasLocation;
          });

          console.log(`[useMapLocationData] Party ${partyId} has ${visitsWithLocation.length} visits with location`);

          if (visitsWithLocation.length > 0) {
            // Use the most recent visit's location (last in array)
            const latestVisitWithLocation = visitsWithLocation[visitsWithLocation.length - 1];

            if (latestVisitWithLocation.location) {
              const { latitude, longitude } = latestVisitWithLocation.location;

              // Validate coordinates
              if (
                typeof latitude !== 'number' ||
                typeof longitude !== 'number' ||
                isNaN(latitude) ||
                isNaN(longitude)
              ) {
                console.error(`[useMapLocationData] Invalid coordinates for party ${partyId}:`, {
                  latitude,
                  longitude,
                });
                continue;
              }

              locationData.push({
                partyId,
                partyName: partyDetails.name,
                address: partyDetails.address,
                latitude,
                longitude,
                visitCount: visitsWithLocation.length,
              });

              console.log(`[useMapLocationData] Added location for party ${partyId}:`, {
                name: partyDetails.name,
                latitude,
                longitude,
                visitCount: visitsWithLocation.length,
              });
            }
          }
        }

        console.log('[useMapLocationData] Final location data:', {
          totalLocations: locationData.length,
          locations: locationData.map((loc) => ({
            partyId: loc.partyId,
            name: loc.partyName,
            visitCount: loc.visitCount,
          })),
        });

        return locationData;
      } catch (error) {
        console.error('[useMapLocationData] Error fetching location data:', error);
        if (error instanceof Error) {
          console.error('[useMapLocationData] Error details:', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    },
    enabled: !!actor && !actorLoading && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
