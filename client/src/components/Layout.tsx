import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import ChatAssistant from "./ChatAssistant";

export default function Layout() {
  return (
    <div className="app-shell">
      <main className="page">
        <Outlet />
      </main>
      <ChatAssistant />
      <BottomNav />
    </div>
  );
}
