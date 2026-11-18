import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading)
    return <div className="app-shell center-screen">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
