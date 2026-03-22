"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearStoredSessionToken } from "@/lib/api/client";
import type { UserSummary } from "@/types/api";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  status: AuthStatus;
  user: UserSummary | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

type MeResponse = {
  status: "success";
  data?: {
    user?: UserSummary;
  };
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe() {
  const response = await apiFetch("/auth/me", { cache: "no-store" });
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSessionToken();
    }
    return null;
  }

  const payload = (await response.json()) as MeResponse;
  return payload.data?.user ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 0,
  });

  const refreshSession = useCallback(async () => {
    await sessionQuery.refetch();
  }, [sessionQuery]);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    clearStoredSessionToken();
    queryClient.setQueryData(["auth", "me"], null);
  }, [queryClient]);

  const status: AuthStatus = useMemo(() => {
    if (sessionQuery.isFetching && sessionQuery.data === undefined) {
      return "loading";
    }
    return sessionQuery.data ? "authenticated" : "guest";
  }, [sessionQuery.isFetching, sessionQuery.data]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: sessionQuery.data ?? null,
      refreshSession,
      logout,
    }),
    [status, sessionQuery.data, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthSession must be used inside AuthProvider");
  }
  return context;
}
