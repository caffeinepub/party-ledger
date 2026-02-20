import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSession } from '@/context/ActorSessionContext';
import type { StaffAccount } from '@/backend';

export function useStaffPermissions() {
  const { actor, isLoading: actorLoading } = useActorSession();

  return useQuery<StaffAccount | null>({
    queryKey: ['staffPermissions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        const accounts = await actor.listStaffAccounts();
        const profile = await actor.getCallerUserProfile();
        
        if (!profile) return null;
        
        const account = accounts.find(acc => acc.loginName === profile.name);
        return account || null;
      } catch (error) {
        console.error('Error fetching staff permissions:', error);
        return null;
      }
    },
    enabled: !!actor && !actorLoading,
    retry: false,
  });
}

export function useAuthenticateStaff() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loginName: string) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        const result = await actor.authenticateStaff(loginName);
        return result;
      } catch (error: any) {
        // If staff account doesn't exist, create it automatically
        if (error.message?.includes('does not exist') || error.message?.includes('Unauthorized')) {
          // This will fail if user is not admin, but that's expected
          // The backend will handle the authorization
          throw new Error('Staff account not found. Please contact an administrator to create your staff account.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
