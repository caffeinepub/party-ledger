import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { toast } from 'sonner';
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      return {
        id: partyId,
        ...result,
      };
    },
    enabled: !!actor && !actorLoading && !!partyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useValidateAndGeneratePartyId() {
  const { actor } = useActorSession();
  const { isAdmin, onAuthorizationError } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: { name: string; phone: string }) => {
      if (!isAdmin) {
        throw new Error('Admin access required to generate party IDs');
      }

      if (!actor) {
        throw new Error('Backend connection not available. Please refresh the page.');
      }

      try {
        const partyId = await actor.validateAndGeneratePartyId(params.name, params.phone);
        return partyId;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Only admins')) {
          onAuthorizationError();
          throw new Error('Admin session expired. Please re-enter your credentials.');
        }

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
  const { isAdmin, onAuthorizationError } = useAdminAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (party: { partyId: string; name: string; address: string; phone: string; pan: string; dueAmount: bigint }) => {
      if (!isAdmin) {
        throw new Error('Admin access required to add parties');
      }

      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');

      try {
        await actor.addParty(party.partyId, party.name, party.address, party.phone, party.pan, party.dueAmount);
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Only admins')) {
          onAuthorizationError();
          throw new Error('Admin session expired. Please re-enter your credentials.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}

export function useUpdateParty() {
  const { actor } = useActorSession();
  const { isAdmin, onAuthorizationError } = useAdminAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { partyId: PartyId; name: string; address: string; phone: string; pan: string; dueAmount: bigint }) => {
      if (!isAdmin) {
        throw new Error('Admin access required to update parties');
      }

      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');

      try {
        await actor.updateParty(params.partyId, params.name, params.address, params.phone, params.pan, params.dueAmount);
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Only admins')) {
          onAuthorizationError();
          throw new Error('Admin session expired. Please re-enter your credentials.');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party', variables.partyId] });
    },
  });
}

export function useDeleteParty() {
  const { actor } = useActorSession();
  const { isAdmin, onAuthorizationError } = useAdminAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partyId: PartyId) => {
      if (!isAdmin) {
        throw new Error('Admin access required to delete parties');
      }

      if (!actor) throw new Error('Backend connection not available. Please refresh the page.');

      try {
        await actor.deleteParty(partyId);
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Only admins')) {
          onAuthorizationError();
          throw new Error('Admin session expired. Please re-enter your credentials.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}
