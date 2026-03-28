"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  getStoredToken,
  setStoredToken,
} from "@/lib/api";
import type { TokenResponse, UserPublic } from "@/types/api";

type AuthContextValue = {
  user: UserPublic | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string | null,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setToken(null);
      return;
    }
    setToken(t);
    const me = await apiFetch<UserPublic>("v1/auth/me");
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = getStoredToken();
        if (!t) {
          if (!cancelled) {
            setUser(null);
            setToken(null);
            setReady(true);
          }
          return;
        }
        setToken(t);
        const me = await apiFetch<UserPublic>("v1/auth/me");
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setStoredToken(null);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<TokenResponse>("v1/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string | null) => {
      const res = await apiFetch<TokenResponse>("v1/auth/register", {
        method: "POST",
        json: {
          email,
          password,
          display_name: displayName?.trim() || null,
        },
      });
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, ready, login, register, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
