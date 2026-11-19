import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import CreateJob from "./pages/CreateJob";
import History from "./pages/History";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Applicants from "./pages/Applicants";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="jobs/new" element={<CreateJob />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="jobs/:id/applicants" element={<Applicants />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
