import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const POLL_INTERVAL_MS = 5000; // check every 5 seconds for real-time blocking

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  isBlocked: boolean;
  login: (email: string, token: string) => void;
  logout: (reason?: string) => void;
  handleBlockedResponse: () => void; // call this when any API returns 403 blocked
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Force logout when blocked ──────────────────────────────────────────────
  const forceBlockLogout = (email: string) => {
    stopPolling();
    localStorage.setItem('blockedEmail', email);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserEmail(null);
    setIsBlocked(true);
    window.location.href = '/login?blocked=1';
  };

  // ── Check block status from server ─────────────────────────────────────────
  const checkBlockStatus = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/me/status?email=${encodeURIComponent(email)}`);
      // Network error or server down — don't log out
      if (res.status === 0 || res.status >= 500) return;
      const data = await res.json();
      // User blocked
      if (data.is_blocked) {
        forceBlockLogout(email);
        return;
      }
      // Only log out if explicitly blocked — ignore 404/errors (DB may be resetting)
      // This prevents false logouts during Railway redeploys
    } catch { /* network error — don't log out on network failures */ }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (email: string) => {
    stopPolling();
    // Check immediately on login, then every 20 seconds
    checkBlockStatus(email);
    pollRef.current = setInterval(() => checkBlockStatus(email), POLL_INTERVAL_MS);
  };

  // ── Restore session on page load ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      startPolling(email);
    }
    return () => stopPolling();
  }, []);

  const login = (email: string, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    localStorage.removeItem('blockedEmail');
    setIsAuthenticated(true);
    setUserEmail(email);
    setIsBlocked(false);
    startPolling(email);
  };

  const logout = (_reason?: string) => {
    stopPolling();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserEmail(null);
    setIsBlocked(false);
  };

  const handleBlockedResponse = () => {
    const email = localStorage.getItem('userEmail') || '';
    if (email) forceBlockLogout(email);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, isBlocked, login, logout, handleBlockedResponse }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
