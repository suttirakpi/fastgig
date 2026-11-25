import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ตั้งค่าใน mobile/.env.local  เช่น EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

// ใช้ต่อ path รูปที่ server ส่งมา เช่น /uploads/avatars/1-123.webp
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}

const TOKEN_KEY = "fastgig_token";

// SecureStore ใช้ได้เฉพาะบนมือถือ ถ้าเปิดแอปในเบราว์เซอร์ใช้ localStorage แทน
interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const webStorage =
  (globalThis as unknown as { localStorage?: WebStorage }).localStorage ?? null;
const isWeb = Platform.OS === "web";

async function readToken(): Promise<string | null> {
  return isWeb
    ? (webStorage?.getItem(TOKEN_KEY) ?? null)
    : SecureStore.getItemAsync(TOKEN_KEY);
}
async function writeToken(token: string): Promise<void> {
  if (isWeb) webStorage?.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
}
async function removeToken(): Promise<void> {
  if (isWeb) webStorage?.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// เก็บ token ไว้ในหน่วยความจำด้วย เพื่อไม่ต้องอ่านที่เก็บทุก request
let memoryToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const tokenStore = {
  async load(): Promise<string | null> {
    try {
      memoryToken = await readToken();
    } catch (err) {
      console.warn("อ่าน token ไม่สำเร็จ", err);
      memoryToken = null;
    }
    return memoryToken;
  },
  async set(token: string) {
    memoryToken = token;
    try {
      await writeToken(token);
    } catch (err) {
      console.warn("บันทึก token ไม่สำเร็จ (ยังใช้งานได้จนกว่าจะปิดแอป)", err);
    }
  },
  async clear() {
    memoryToken = null;
    try {
      await removeToken();
    } catch (err) {
      console.warn("ลบ token ไม่สำเร็จ", err);
    }
  },
  get: () => memoryToken,
};

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const url = err.config?.url ?? "";
      if (err.response?.status === 401 && !url.startsWith("/auth/login"))
        onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: { message: string }[] }
      | undefined;
    if (data?.errors?.length)
      return data.errors.map((e) => e.message).join(" / ");
    if (data?.message) return data.message;
    if (!err.response)
      return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบ Wi-Fi และที่อยู่ API";
  }
  return "เกิดข้อผิดพลาด";
}
