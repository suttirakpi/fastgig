import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { APPLICATION_LABEL, formatAge, formatPay } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { Job } from "../lib/types";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, error, loading, reload } = useGet<{ job: Job }>(`/jobs/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function apply() {
    setBusy(true);
    setActionError("");
    try {
      await api.post(`/jobs/${id}/apply`);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const job = data?.job;

  return (
    <>
      <PageHeader title="รายละเอียดงาน" />
      {loading && !job && <div className="empty">กำลังโหลด...</div>}
      {error && <div className="alert section">{error}</div>}

      {job && (
        <>
          <div className="detail-hero">
            <div className="avatar big">
              {(job.employer?.username ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="muted">ผู้ลงงาน: {job.employer?.username}</div>
            <h2>{job.title}</h2>
            <div className="pills">
              <span className="pill">{job.category ?? "ทั่วไป"}</span>
              <span className="pill">{formatPay(job.payMin, job.payMax)}</span>
              <span className="pill">
                อายุ {formatAge(job.ageMin, job.ageMax)}
              </span>
            </div>
            {job.locationText && (
              <div className="muted">สถานที่: {job.locationText}</div>
            )}
          </div>

          <div className="section">
            <h3>Description</h3>
            <div className="desc-box">{job.description}</div>
          </div>

          <div className="actions">
            {actionError && <div className="alert">{actionError}</div>}
            {job.employerId === user?.id ? (
              <div className="notice">
                นี่คืองานที่คุณลงเอง (หน้าจัดการผู้สมัครจะเพิ่มในขั้นถัดไป)
              </div>
            ) : job.myApplication ? (
              <div className="notice">
                สถานะการสมัคร:{" "}
                <b>{APPLICATION_LABEL[job.myApplication.status]}</b>
              </div>
            ) : job.status !== "OPEN" ? (
              <div className="notice">งานนี้ปิดรับสมัครแล้ว</div>
            ) : (
              <button
                className="btn btn-block"
                onClick={() => void apply()}
                disabled={busy}
              >
                {busy ? "กำลังสมัคร..." : "รับงาน"}
              </button>
            )}
            <button className="link-btn" onClick={() => navigate(-1)}>
              ย้อนกลับ
            </button>
          </div>
        </>
      )}
    </>
  );
}
