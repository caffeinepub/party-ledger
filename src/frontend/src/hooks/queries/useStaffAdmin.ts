import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorSafe } from '../useActorSafe';
import type { StaffAccountInfo, LoginName, Password } from '../../backend';

export function useListStaffAccounts() {
  const { actor, isLoading: actorLoading } = useActorSafe();

  return useQuery<StaffAccountInfo[]>({
    queryKey: ['staffAccounts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listStaffAccounts();
    },
    enabled: !!actor && !actorLoading,
  });
}

export function useCreateStaffAccount() {
  const { actor } = useActorSafe();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      loginName: LoginName;
      password: Password;
      canViewAllRecords: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createStaffAccount(
        params.loginName,
        params.password,
        params.canViewAllRecords
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

export function useUpdateStaffAccount() {
  const { actor } = useActorSafe();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      loginName: LoginName;
      newPassword?: Password;
      canViewAllRecords?: boolean;
      isDisabled?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateStaffAccount(
        params.loginName,
        params.newPassword || null,
        params.canViewAllRecords !== undefined ? params.canViewAllRecords : null,
        params.isDisabled !== undefined ? params.isDisabled : null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

export function useDisableStaffAccount() {
  const { actor } = useActorSafe();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loginName: LoginName) => {
      if (!actor) throw new Error('Actor not available');
      await actor.disableStaffAccount(loginName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

export function useResetAdminPassword() {
  const { actor } = useActorSafe();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPassword: Password): Promise<{ loginName: string; password: string }> => {
      const adminLoginName = 'rkbrothers.lts';

      // Step 1: Check if actor is available
      if (!actor) {
        throw new Error('You must be logged in with Internet Identity before resetting the admin password. Please log in with Internet Identity and try again.');
      }

      // Step 2: Pre-check admin status
      let isAdmin = false;
      try {
        isAdmin = await actor.isCallerAdmin();
        if (!isAdmin) {
          throw new Error('Only an admin can reset the admin password. If this is first-time setup, ensure you are authenticated with Internet Identity as the initial admin.');
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes('Only an admin')) {
          throw error;
        }
        // If isCallerAdmin fails for other reasons, continue and let setAdminStaffPassword handle it
      }

      // Step 3: Attempt to set the password
      try {
        await actor.setAdminStaffPassword(newPassword);
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('Only admins')) {
          throw new Error('Unauthorized: Only admins can reset the admin password. Please ensure you are logged in with Internet Identity as an admin.');
        } else if (errorMsg.includes('bound to a different')) {
          throw new Error('This admin account is bound to a different Internet Identity. You must log in with the correct Internet Identity to reset the password.');
        } else {
          throw new Error(`Failed to set admin password: ${errorMsg}`);
        }
      }

      // Step 4: Verify the password was set correctly by attempting authentication
      let authSuccess = false;
      try {
        authSuccess = await actor.authenticateStaff(adminLoginName, newPassword);
        
        if (!authSuccess) {
          throw new Error('Password reset verification failed: The new password does not work for the admin account. The backend may not have persisted the change. Please retry.');
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        
        // If verification fails, the password wasn't actually set or persisted
        if (errorMsg.includes('verification failed')) {
          throw error;
        } else if (errorMsg.includes('bound to a different')) {
          throw new Error('Verification failed: The admin account is now bound to a different Internet Identity. The password was set but cannot be verified. You may need to log in with the bound identity to use it.');
        } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('Must be authenticated')) {
          throw new Error('Password reset verification failed: Unable to verify the password because Internet Identity authentication is required. The password may have been set, but verification could not complete. Please try logging in.');
        } else {
          throw new Error(`Password reset verification failed: Unable to confirm the new password works. Error: ${errorMsg}. The backend may not have persisted the change.`);
        }
      }

      // If we reach here, the password was successfully set and verified
      return { loginName: adminLoginName, password: newPassword };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}
