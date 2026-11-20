import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "./api";
import type { User } from "./types";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  age: string;
  skill: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // เปิดแอป: โหลด token ที่เก็บไว้ แล้วลองดึงโปรไฟล์
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStore.load();
        if (token) await refreshUser();
      } catch {
        await tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password },
    );
    await tokenStore.set(data.token);
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
    await tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
