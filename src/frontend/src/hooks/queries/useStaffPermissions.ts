import { useQuery } from '@tanstack/react-query';
import { useActorSession } from '../../context/ActorSessionContext';
import type { StaffAccountInfo } from '../../backend';

export function useGetStaffPermissions(staffLoginName: string | null) {
  const { actor } = useActorSession();

  return useQuery<StaffAccountInfo | null>({
    queryKey: ['staffPermissions', staffLoginName],
    queryFn: async () => {
      if (!actor || !staffLoginName) return null;
      
      try {
        const accounts = await actor.listStaffAccounts();
        const account = accounts.find(acc => acc.loginName === staffLoginName);
        return account || null;
      } catch (error: any) {
        // If not admin, we can't list accounts, so assume basic permissions
        if (error.message?.includes('Unauthorized')) {
          return {
            loginName: staffLoginName,
            boundPrincipal: undefined,
            isDisabled: false,
            canViewAllRecords: true, // Assume true for non-admin staff
          };
        }
        throw error;
      }
    },
    enabled: !!actor && !!staffLoginName,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
