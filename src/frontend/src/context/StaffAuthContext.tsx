import { createContext, useContext, ReactNode } from 'react';
import { useStaffAuth } from '../hooks/useStaffAuth';

interface StaffAuthContextValue {
  staffLoginName: string | null;
  isStaffAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  isAdmin: boolean;
  login: (loginName: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextValue | null>(null);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const staffAuth = useStaffAuth();
  
  return (
    <StaffAuthContext.Provider value={staffAuth}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuthContext() {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuthContext must be used within StaffAuthProvider');
  }
  return context;
}
