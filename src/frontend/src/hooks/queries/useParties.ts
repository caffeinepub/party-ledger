import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { Party, PartyId } from '../../backend';

export function useGetAllParties(options?: { enabled?: boolean }) {
  const { actor, isLoading: actorLoading } = useActorSession();
  
  const enabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery<Array<[PartyId, Party]>>({
    queryKey: ['parties'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllParties();
    },
    enabled: enabled && !!actor && !actorLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useGetParty(partyId: PartyId) {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<Party | null>({
    queryKey: ['party', partyId],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getParty(partyId);
      if (!result) return null;
      // Backend returns party without id, so we add it
      return {
        id: partyId,
        ...result,
      };
    },
    enabled: !!actor && !actorLoading && !!partyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useValidateAndGeneratePartyId() {
  const { actor } = useActorSession();

  return useMutation({
    mutationFn: async (params: { name: string; phone: string }) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🔵 Starting party ID generation`, {
        name: params.name,
        phone: params.phone,
        nameLength: params.name.length,
        phoneLength: params.phone.length,
      });

      if (!actor) {
        console.error(`[${timestamp}] ❌ Actor not available`);
        throw new Error('Backend connection not available. Please refresh the page.');
      }

      console.log(`[${timestamp}] ✅ Actor is available, calling validateAndGeneratePartyId...`);

      try {
        const startTime = performance.now();
        const partyId = await actor.validateAndGeneratePartyId(params.name, params.phone);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        console.log(`[${timestamp}] ✅ Party ID generated successfully`, {
          partyId,
          duration: `${duration}ms`,
        });

        return partyId;
      } catch (error: any) {
        console.error(`[${timestamp}] ❌ Party ID generation failed`, {
          errorMessage: error?.message || 'Unknown error',
          errorName: error?.name,
          errorStack: error?.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });

        // Provide user-friendly error messages
        if (error?.message?.includes('already exists')) {
          throw new Error('A party with this name already exists. Please use a different name.');
        } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          throw new Error('Unable to connect to the backend. Please check your internet connection.');
        } else if (error?.message?.includes('timeout')) {
          throw new Error('Party ID generation timed out. Please try again.');
        } else {
          throw new Error(error?.message || 'Failed to generate party ID. Please try again.');
        }
      }
    },
  });
}

export function useAddParty() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (party: { partyId: string; name: string; address: string; phone: string; pan: string; dueAmount: bigint }) => {
      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');
      await actor.addParty(party.partyId, party.name, party.address, party.phone, party.pan, party.dueAmount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}

export function useUpdateParty() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { partyId: PartyId; name: string; address: string; phone: string; pan: string; dueAmount: bigint }) => {
      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');
      await actor.updateParty(params.partyId, params.name, params.address, params.phone, params.pan, params.dueAmount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party', variables.partyId] });
    },
  });
}

export function useDeleteParty() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partyId: PartyId) => {
      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');
      await actor.deleteParty(partyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}
