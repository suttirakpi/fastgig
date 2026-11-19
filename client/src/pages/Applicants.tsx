import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { api, errorMessage } from "../lib/api";
import {
  APPLICATION_LABEL,
  JOB_STATUS_LABEL,
  RESULT_LABEL,
  RESULT_POINTS,
  formatPay,
  signed,
  trustLevel,
} from "../lib/format";
import { useGet } from "../lib/useGet";
import type { Applicant, Job, WorkResult } from "../lib/types";

const RATINGS: { value: WorkResult; className: string }[] = [
  { value: "PASS", className: "btn btn-small btn-ok" },
  { value: "FAIR", className: "btn btn-small btn-warn" },
  { value: "FAIL", className: "btn btn-small btn-danger" },
];

export default function Applicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobQ = useGet<{ job: Job }>(`/jobs/${id}`);
  const appQ = useGet<{ applicants: Applicant[] }>(`/jobs/${id}/applicants`);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const job = jobQ.data?.job;
  const applicants = appQ.data?.applicants ?? [];

  async function refresh() {
    await Promise.all([jobQ.reload(), appQ.reload()]);
  }

  async function decide(
    applicationId: number,
    status: "ACCEPTED" | "REJECTED",
  ) {
    if (
      status === "ACCEPTED" &&
      !window.confirm(
        "ยืนยันเลือกคนนี้ทำงาน? ผู้สมัครคนอื่นจะถูกปฏิเสธอัตโนมัติ",
      )
    ) {
      return;
    }
    setBusyId(applicationId);
    setActionError("");
    setDoneMsg("");
    try {
      await api.patch(`/jobs/${id}/applicants/${applicationId}`, { status });
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function complete(applicationId: number, result: WorkResult) {
    const label = `${RESULT_LABEL[result]} (${signed(RESULT_POINTS[result])} คะแนน)`;
    if (
      !window.confirm(`ยืนยันจบงานด้วยผลประเมิน "${label}"? แก้ไขภายหลังไม่ได้`)
    )
      return;
    setBusyId(applicationId);
    setActionError("");
    setDoneMsg("");
    try {
      const { data } = await api.post<{
        pointsChange: number;
        trustPoints: number;
      }>(`/jobs/${id}/complete`, { result });
      setDoneMsg(
        `จบงานเรียบร้อย ผู้ทำงานได้ ${signed(data.pointsChange)} คะแนน (รวม ${data.trustPoints})`,
      );
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const busy = busyId !== null;

  return (
    <>
      <PageHeader title="รายชื่อผู้สมัคร" />

      {job && (
        <div className="section">
          <div className="card">
            <h3 className="card-title">{job.title}</h3>
            <div className="job-meta">
              <StatusBadge
                status={job.status}
                label={JOB_STATUS_LABEL[job.status]}
              />
              <strong>{formatPay(job.payMin, job.payMax)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="list">
        {(jobQ.loading || appQ.loading) && !appQ.data && (
          <div className="empty">กำลังโหลด...</div>
        )}
        {appQ.error && <div className="alert">{appQ.error}</div>}
        {actionError && <div className="alert">{actionError}</div>}
        {doneMsg && <div className="notice ok">{doneMsg}</div>}
        {appQ.data && applicants.length === 0 && (
          <div className="empty">ยังไม่มีผู้สมัคร</div>
        )}

        {applicants.map((a) => (
          <article className="card" key={a.id}>
            <div className="job-card-top">
              <div className="avatar">
                {a.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="job-card-body">
                <h3>{a.user.username}</h3>
                <div className="pills left">
                  <span className="pill">{trustLevel(a.user.trustPoints)}</span>
                  <span className="pill">{a.user.trustPoints} pts</span>
                </div>
                <div className="muted">
                  อายุ {a.user.age ?? "-"} · งานสำเร็จ {a.user.completedJobs}
                </div>
                {a.user.skills && (
                  <div className="muted">ทักษะ: {a.user.skills}</div>
                )}
              </div>
            </div>

            <div className="applicant-foot">
              <div className="card-actions">
                <StatusBadge
                  status={a.status}
                  label={APPLICATION_LABEL[a.status]}
                />
                {a.result && (
                  <StatusBadge
                    status={a.result}
                    label={`ผลประเมิน: ${RESULT_LABEL[a.result]}`}
                  />
                )}
              </div>

              {a.status === "PENDING" && job?.status === "OPEN" && (
                <div className="applicant-actions">
                  <button
                    className="btn btn-small btn-ok"
                    disabled={busy}
                    onClick={() => void decide(a.id, "ACCEPTED")}
                  >
                    ยอมรับ
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    disabled={busy}
                    onClick={() => void decide(a.id, "REJECTED")}
                  >
                    ปฏิเสธ
                  </button>
                </div>
              )}

              {a.status === "ACCEPTED" && job?.status === "IN_PROGRESS" && (
                <>
                  <div className="rate-title">
                    งานเสร็จแล้ว? เลือกผลประเมินเพื่อจบงาน
                  </div>
                  <div className="rate-row">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        className={r.className}
                        disabled={busy}
                        onClick={() => void complete(a.id, r.value)}
                      >
                        {RESULT_LABEL[r.value]} (
                        {signed(RESULT_POINTS[r.value])})
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="actions">
        <button
          className="link-btn"
          onClick={() => navigate("/history?tab=mine")}
        >
          ย้อนกลับ
        </button>
      </div>
    </>
  );
}
