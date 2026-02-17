import React, { createContext, useContext, ReactNode } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActorSession } from './ActorSessionContext';
import { useStaffAuthContext } from './StaffAuthContext';

interface AppReadinessContextValue {
  isIIAuthenticated: boolean;
  isActorReady: boolean;
  isStaffAuthenticated: boolean;
  isAppReadyForMainData: boolean;
}

const AppReadinessContext = createContext<AppReadinessContextValue | undefined>(undefined);

export function AppReadinessProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const { actor, isLoading: actorLoading } = useActorSession();
  const { isStaffAuthenticated } = useStaffAuthContext();

  const isIIAuthenticated = !!identity;
  const isActorReady = !!actor && !actorLoading;
  const isAppReadyForMainData = isIIAuthenticated && isActorReady && isStaffAuthenticated;

  const value: AppReadinessContextValue = {
    isIIAuthenticated,
    isActorReady,
    isStaffAuthenticated,
    isAppReadyForMainData,
  };

  return (
    <AppReadinessContext.Provider value={value}>
      {children}
    </AppReadinessContext.Provider>
  );
}

export function useAppReadiness() {
  const context = useContext(AppReadinessContext);
  if (context === undefined) {
    throw new Error('useAppReadiness must be used within AppReadinessProvider');
  }
  return context;
}
