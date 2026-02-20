import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// Temporary implementation until backend interface is regenerated
// These methods exist in the backend but aren't in the TypeScript interface yet
interface ExtendedActor {
  getAdminPrincipals?: () => Promise<Principal[]>;
  addAdminPrincipal?: (principal: Principal) => Promise<void>;
  removeAdminPrincipal?: (principal: Principal) => Promise<void>;
  isCallerAdmin: () => Promise<boolean>;
}

export function useGetAdminPrincipals() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<Principal[]>({
    queryKey: ['adminPrincipals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getAdminPrincipals) {
        throw new Error('Backend method getAdminPrincipals not available. Please regenerate backend bindings.');
      }
      return extendedActor.getAdminPrincipals();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAddAdminPrincipal() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.addAdminPrincipal) {
        throw new Error('Backend method addAdminPrincipal not available. Please regenerate backend bindings.');
      }
      const principal = Principal.fromText(principalId);
      await extendedActor.addAdminPrincipal(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipals'] });
      toast.success('Admin Principal added successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to add admin Principal';
      toast.error(errorMessage);
    },
  });
}

export function useRemoveAdminPrincipal() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.removeAdminPrincipal) {
        throw new Error('Backend method removeAdminPrincipal not available. Please regenerate backend bindings.');
      }
      const principal = Principal.fromText(principalId);
      await extendedActor.removeAdminPrincipal(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipals'] });
      toast.success('Admin Principal removed successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to remove admin Principal';
      toast.error(errorMessage);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
