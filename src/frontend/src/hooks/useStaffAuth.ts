import { useState, useEffect } from 'react';
import { useActorSession } from '../context/ActorSessionContext';
import { useQueryClient } from '@tanstack/react-query';
import { setStaffSession, getStaffSession, clearStaffSession, isAdminStaff } from '../utils/staffSession';

export function useStaffAuth() {
  const { actor } = useActorSession();
  const queryClient = useQueryClient();
  const [staffLoginName, setStaffLoginName] = useState<string | null>(null);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    const session = getStaffSession();
    if (session.isAuthenticated && session.loginName) {
      setStaffLoginName(session.loginName);
      setIsStaffAuthenticated(true);
    }
  }, []);

  const login = async (loginName: string, password: string): Promise<boolean> => {
    if (!actor) {
      setAuthError('System not ready. Please try again.');
      return false;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const success = await actor.authenticateStaff(loginName, password);
      
      if (success) {
        setStaffSession(loginName);
        setStaffLoginName(loginName);
        setIsStaffAuthenticated(true);
        setAuthError(null);
        return true;
      } else {
        // Backend returned false - invalid credentials or disabled account
        setAuthError('Invalid staff ID or password. Your account may also be disabled. Please check your credentials or contact your administrator.');
        return false;
      }
    } catch (error: any) {
      // Classify backend trap errors by exact message matching
      const errorMessage = error.message || String(error);
      
      if (errorMessage.includes('Unauthorized: Must be authenticated with Internet Identity')) {
        setAuthError('You must log in with Internet Identity first before accessing staff login.');
      } else if (errorMessage.includes('This staff account is bound to a different Internet Identity')) {
        setAuthError('This staff account is linked to a different Internet Identity. Please log out and sign in with the correct Internet Identity.');
      } else {
        // Generic error fallback
        setAuthError(`Login failed: ${errorMessage}`);
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    clearStaffSession();
    setStaffLoginName(null);
    setIsStaffAuthenticated(false);
    setAuthError(null);
    queryClient.clear();
  };

  const isAdmin = isAdminStaff(staffLoginName);

  return {
    staffLoginName,
    isStaffAuthenticated,
    isAuthenticating,
    authError,
    isAdmin,
    login,
    logout,
  };
}
