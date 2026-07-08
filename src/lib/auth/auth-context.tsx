"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";
import { refreshAccessToken } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/api/types";
import { getCurrentUser } from "@/features/auth/api";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiry
} from "@/lib/auth/token-storage";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser;
  bootstrapSession: () => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_EARLY_MS = 60 * 1000;
const REFRESH_CHECK_INTERVAL_MS = 30 * 1000;

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<CurrentUser>(null);

  const logout = useCallback(() => {
    clearAuthTokens();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  const bootstrapSession = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      setUser(null);
      setStatus("unauthenticated");
      return false;
    }

    if (!accessToken && refreshToken) {
      const refreshed = await refreshAccessToken();

      if (!refreshed) {
        setUser(null);
        setStatus("unauthenticated");
        return false;
      }
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(normalizeCurrentUser(currentUser));
      setStatus("authenticated");
      return true;
    } catch {
      setUser(null);
      setStatus("unauthenticated");
      return false;
    }
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const intervalId = window.setInterval(async () => {
      const token = getAccessToken();
      if (!token) return;

      const expiry = getTokenExpiry(token);
      if (!expiry || expiry - Date.now() > REFRESH_EARLY_MS) return;

      const refreshed = await refreshAccessToken();
      if (!refreshed) logout();
    }, REFRESH_CHECK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [logout, status]);

  const value = useMemo(
    () => ({ bootstrapSession, logout, status, user }),
    [bootstrapSession, logout, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

function normalizeCurrentUser(value: unknown): CurrentUser {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as CurrentUser;
}
