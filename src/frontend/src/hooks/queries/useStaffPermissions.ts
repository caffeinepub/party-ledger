// This file is no longer needed as staff authentication has been removed
// All users can now access party management features without authentication
export function useStaffPermissions() {
  return { data: null, isLoading: false };
}

export function useAuthenticateStaff() {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  };
}
