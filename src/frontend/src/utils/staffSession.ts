// Staff session management utilities
// Provides app-level staff authentication state persistence

const STAFF_LOGIN_NAME_KEY = 'staff_login_name';
const STAFF_AUTHENTICATED_KEY = 'staff_authenticated';

// Admin staff accounts - both have full admin privileges
export const ADMIN_STAFF_ACCOUNTS = ['rkbrothers.lts', 'rajan'];

export function setStaffSession(loginName: string): void {
  sessionStorage.setItem(STAFF_LOGIN_NAME_KEY, loginName);
  sessionStorage.setItem(STAFF_AUTHENTICATED_KEY, 'true');
}

export function getStaffSession(): { loginName: string | null; isAuthenticated: boolean } {
  const loginName = sessionStorage.getItem(STAFF_LOGIN_NAME_KEY);
  const isAuthenticated = sessionStorage.getItem(STAFF_AUTHENTICATED_KEY) === 'true';
  return { loginName, isAuthenticated: isAuthenticated && !!loginName };
}

export function clearStaffSession(): void {
  sessionStorage.removeItem(STAFF_LOGIN_NAME_KEY);
  sessionStorage.removeItem(STAFF_AUTHENTICATED_KEY);
}

export function isAdminStaff(loginName: string | null): boolean {
  if (!loginName) return false;
  return ADMIN_STAFF_ACCOUNTS.includes(loginName);
}
