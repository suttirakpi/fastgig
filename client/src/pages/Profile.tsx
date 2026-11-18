import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { PointsSummary } from "../lib/types";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: points, error } = useGet<PointsSummary>("/points");

  if (!user) return null;

  return (
    <>
      <PageHeader
        title="โปรไฟล์"
        action={
          <button className="chip-btn danger" onClick={logout}>
            Logout
          </button>
        }
      />
      <div className="detail-hero">
        <div className="avatar big">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h2>{user.username}</h2>
        <div className="pills">
          <span className="pill">{points?.level ?? "..."}</span>
          <span className="pill">
            {points?.trustPoints ?? user.trustPoints} pts
          </span>
          <span className="pill">
            งานสำเร็จ {points?.completedJobs ?? user.completedJobs}
          </span>
        </div>
      </div>

      <div className="section kv">
        <div>
          <span>Email</span>
          {user.email}
        </div>
        <div>
          <span>Phone</span>
          {user.phone ?? "-"}
        </div>
        <div>
          <span>Age</span>
          {user.age ?? "-"}
        </div>
        <div>
          <span>Skill</span>
          {user.skills ?? "-"}
        </div>
      </div>

      <div className="section">
        <h3>ประวัติคะแนน</h3>
        {error && <div className="alert">{error}</div>}
        {points && points.entries.length === 0 && (
          <div className="empty">ยังไม่มีประวัติคะแนน</div>
        )}
        <ul className="ledger">
          {points?.entries.map((e) => (
            <li key={e.id} className="card">
              <div>
                <div>{e.reason}</div>
                <small>{formatDateTime(e.createdAt)}</small>
              </div>
              <strong className={e.points >= 0 ? "plus" : "minus"}>
                {e.points > 0 ? `+${e.points}` : e.points}
              </strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
