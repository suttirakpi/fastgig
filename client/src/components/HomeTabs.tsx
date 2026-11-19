import { Link, NavLink } from "react-router-dom";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "tab active" : "tab";

export default function HomeTabs() {
  return (
    <div className="tabs">
      <NavLink to="/" end className={tabClass}>
        งานทั้งหมด
      </NavLink>
      <NavLink to="/ai-match" className={tabClass}>
        AI Match
      </NavLink>
      <NavLink to="/dashboard" className={tabClass}>
        Dashboard
      </NavLink>
      <Link className="tab create" to="/jobs/new">
        + สร้างงาน
      </Link>
    </div>
  );
}
