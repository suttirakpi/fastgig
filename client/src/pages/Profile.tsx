import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Avatar from "../components/Avatar";
import PageHeader from "../components/PageHeader";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { PointsSummary } from "../lib/types";

const MAX_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { data: points, error } = useGet<PointsSummary>("/points");
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  if (!user) return null;

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setPhotoError("รองรับเฉพาะไฟล์ JPG, PNG, WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError("ไฟล์ใหญ่เกิน 5 MB");
      return;
    }
    setBusy(true);
    setPhotoError("");
    try {
      const form = new FormData();
      form.append("avatar", file);
      await api.post("/users/me/avatar", form);
      await refreshUser();
    } catch (err) {
      setPhotoError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!window.confirm("ลบรูปโปรไฟล์?")) return;
    setBusy(true);
    setPhotoError("");
    try {
      await api.delete("/users/me/avatar");
      await refreshUser();
    } catch (err) {
      setPhotoError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

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
        <Avatar name={user.username} src={user.profileImage} big />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => void onPick(e)}
        />
        <div className="photo-actions">
          <button
            className="btn btn-small btn-outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy
              ? "กำลังอัปโหลด..."
              : user.profileImage
                ? "เปลี่ยนรูป"
                : "เพิ่มรูปโปรไฟล์"}
          </button>
          {user.profileImage && (
            <button
              className="link-btn"
              disabled={busy}
              onClick={() => void removePhoto()}
            >
              ลบรูป
            </button>
          )}
        </div>
        {photoError && <div className="alert">{photoError}</div>}

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
