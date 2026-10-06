export interface AuthUser {
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'HRD';
}

const TOKEN_KEY = 'dexa_attendance_token';
const USER_KEY = 'dexa_attendance_user';

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const json = sessionStorage.getItem(USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyListeners(user);
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  notifyListeners(null);
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(user: AuthUser | null): void {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch {
      // ignore listener errors
    }
  });
}
