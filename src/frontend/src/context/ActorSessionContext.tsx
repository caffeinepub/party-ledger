import React, { createContext, useContext, ReactNode } from 'react';
import { useActorSafe } from '../hooks/useActorSafe';
import type { backendInterface } from '../backend';

interface ActorSessionContextValue {
  actor: backendInterface | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  principalKey: string | undefined;
}

const ActorSessionContext = createContext<ActorSessionContextValue | undefined>(undefined);

export function ActorSessionProvider({ children }: { children: ReactNode }) {
  const { actor, isLoading, isFetching, isError, error, refetch } = useActorSafe();
  
  // Create a stable principal key for query invalidation
  const principalKey = actor ? 'authenticated' : undefined;

  const value: ActorSessionContextValue = {
    actor,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    principalKey,
  };

  return (
    <ActorSessionContext.Provider value={value}>
      {children}
    </ActorSessionContext.Provider>
  );
}

export function useActorSession() {
  const context = useContext(ActorSessionContext);
  if (context === undefined) {
    throw new Error('useActorSession must be used within ActorSessionProvider');
  }
  return context;
}
