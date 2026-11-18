import { createContext, useContext } from "react";
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

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  return ctx;
}
