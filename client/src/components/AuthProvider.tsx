import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import { AuthContext } from "../lib/auth";
import type { AuthState, RegisterInput } from "../lib/auth";
import type { User } from "../lib/types";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => tokenStore.get() !== null,
  );

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    setUser(data.user);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    refreshUser()
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/login",
      {
        email,
        password,
      },
    );
    tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/register",
      {
        username: input.username,
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword,
        phone: input.phone || undefined,
        age: input.age ? Number(input.age) : undefined,
        skill: input.skill || undefined,
      },
    );
    tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
