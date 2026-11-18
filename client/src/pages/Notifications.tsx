import PageHeader from "../components/PageHeader";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { NotificationItem } from "../lib/types";

export default function Notifications() {
  const { data, error, loading, reload } = useGet<{
    notifications: NotificationItem[];
    unread: number;
  }>("/notifications");

  async function markAllRead() {
    await api.post("/notifications/read-all");
    await reload();
  }

  return (
    <>
      <PageHeader
        title="แจ้งเตือน"
        action={
          data && data.unread > 0 ? (
            <button className="chip-btn" onClick={() => void markAllRead()}>
              อ่านทั้งหมด ({data.unread})
            </button>
          ) : undefined
        }
      />
      <div className="list">
        {loading && !data && <div className="empty">กำลังโหลด...</div>}
        {error && <div className="alert">{error}</div>}
        {data && data.notifications.length === 0 && (
          <div className="empty">No Data</div>
        )}
        {data?.notifications.map((n) => (
          <div
            key={n.id}
            className={n.isRead ? "card notif" : "card notif unread"}
          >
            <div>{n.content}</div>
            <small>{formatDateTime(n.createdAt)}</small>
          </div>
        ))}
      </div>
    </>
  );
}
