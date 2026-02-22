import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  isAdminValidated: boolean;
  adminUsername: string | null;
  promptForCredentials: () => void;
  validateCredentials: (username: string, password: string) => boolean;
  clearAdminSession: () => void;
  showPrompt: boolean;
  setShowPrompt: (show: boolean) => void;
  onAuthorizationError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_USERNAME = 'rajan';
const ADMIN_PASSWORD = 'Admin@123';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminValidated, setIsAdminValidated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const promptForCredentials = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const validateCredentials = useCallback((username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAdminValidated(true);
      setAdminUsername(username);
      setShowPrompt(false);
      return true;
    }
    return false;
  }, []);

  const clearAdminSession = useCallback(() => {
    setIsAdminValidated(false);
    setAdminUsername(null);
    setShowPrompt(false);
  }, []);

  const onAuthorizationError = useCallback(() => {
    setIsAdminValidated(false);
    setAdminUsername(null);
    setShowPrompt(true);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin: isAdminValidated,
        isAdminValidated,
        adminUsername,
        promptForCredentials,
        validateCredentials,
        clearAdminSession,
        showPrompt,
        setShowPrompt,
        onAuthorizationError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
