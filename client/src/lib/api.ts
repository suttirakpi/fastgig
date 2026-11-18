import axios from "axios";

const TOKEN_KEY = "fastgig_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token หมดอายุ/ไม่ถูกต้อง -> กลับหน้า login (ยกเว้นตอนกำลังล็อกอินเอง)
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const url = err.config?.url ?? "";
      if (err.response?.status === 401 && !url.startsWith("/auth/login")) {
        tokenStore.clear();
        if (window.location.pathname !== "/login")
          window.location.assign("/login");
      }
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
    if (!err.response) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
  }
  return "เกิดข้อผิดพลาด";
}
