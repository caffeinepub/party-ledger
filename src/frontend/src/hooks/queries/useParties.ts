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
      if (!actor) throw new Error('Actor not available');
      return actor.validateAndGenerateNewPartyId(params.name, params.phone);
    },
  });
}

export function useAddParty() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (party: { partyId: string; name: string; address: string; phone: string; pan: string; dueAmount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      await actor.deleteParty(partyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}
