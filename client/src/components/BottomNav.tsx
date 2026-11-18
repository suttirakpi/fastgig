import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const items: { to: string; label: string; end?: boolean; icon: ReactNode }[] = [
  {
    to: "/",
    label: "หน้าแรก",
    end: true,
    icon: (
      <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    ),
  },
  {
    to: "/profile",
    label: "โปรไฟล์",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
  {
    to: "/history",
    label: "ประวัติ",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    to: "/notifications",
    label: "แจ้งเตือน",
    icon: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          aria-label={item.label}
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {item.icon}
          </svg>
        </NavLink>
      ))}
    </nav>
  );
}
