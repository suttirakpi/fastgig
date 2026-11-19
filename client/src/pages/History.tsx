import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import {
  APPLICATION_LABEL,
  JOB_STATUS_LABEL,
  RESULT_LABEL,
  formatAge,
  formatPay,
} from "../lib/format";
import { useGet } from "../lib/useGet";
import type { AppliedItem, MyJob } from "../lib/types";
import Avatar from "../components/Avatar";

function FindJobsTab() {
  const { data, error, loading } = useGet<{ applications: AppliedItem[] }>(
    "/jobs/applied",
  );

  return (
    <div className="list">
      {loading && !data && <div className="empty">กำลังโหลด...</div>}
      {error && <div className="alert">{error}</div>}
      {data && data.applications.length === 0 && (
        <div className="empty">ยังไม่เคยสมัครงาน</div>
      )}
      {data?.applications.map((a) => (
        <article className="card" key={a.id}>
          <div className="job-card-top">
            <Avatar
              name={a.job.employer?.username ?? "?"}
              src={a.job.employer?.profileImage}
            />
            <div className="job-card-body">
              <h3>{a.job.title}</h3>
              <p className="clamp">{a.job.description}</p>
              <div className="job-meta">
                <span>อายุ: {formatAge(a.job.ageMin, a.job.ageMax)}</span>
                <strong>{formatPay(a.job.payMin, a.job.payMax)}</strong>
              </div>
            </div>
          </div>
          <div className="job-card-foot">
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
            <Link className="btn btn-small" to={`/jobs/${a.job.id}`}>
              ดูรายละเอียด
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function MyJobsTab() {
  const { data, error, loading } = useGet<{ jobs: MyJob[] }>("/jobs/mine");

  return (
    <div className="list">
      {loading && !data && <div className="empty">กำลังโหลด...</div>}
      {error && <div className="alert">{error}</div>}
      {data && data.jobs.length === 0 && (
        <div className="empty">ยังไม่เคยลงงาน</div>
      )}
      {data?.jobs.map((job) => (
        <article className="card" key={job.id}>
          <h3 className="card-title">{job.title}</h3>
          <p className="clamp">{job.description}</p>
          <div className="job-meta">
            <StatusBadge
              status={job.status}
              label={JOB_STATUS_LABEL[job.status]}
            />
            <strong>{formatPay(job.payMin, job.payMax)}</strong>
          </div>
          <div className="card-actions">
            {job.pendingApplicants > 0 && (
              <span className="badge warn">
                รอตอบรับ {job.pendingApplicants} คน
              </span>
            )}
            <Link className="btn btn-small btn-outline" to={`/jobs/${job.id}`}>
              รายละเอียด
            </Link>
            <Link className="btn btn-small" to={`/jobs/${job.id}/applicants`}>
              ผู้สมัคร / จบงาน
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function History() {
  const [params, setParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const tab = params.get("tab") === "mine" ? "mine" : "find";

  return (
    <>
      <PageHeader
        title="ประวัติ"
        action={
          <button className="chip-btn" onClick={() => setVersion((v) => v + 1)}>
            Refresh
          </button>
        }
      />
      <div className="tabs">
        <button
          className={tab === "find" ? "tab active" : "tab"}
          onClick={() => setParams({})}
        >
          Find Jobs
        </button>
        <button
          className={tab === "mine" ? "tab active" : "tab"}
          onClick={() => setParams({ tab: "mine" })}
        >
          My Jobs
        </button>
      </div>
      {tab === "find" ? (
        <FindJobsTab key={version} />
      ) : (
        <MyJobsTab key={version} />
      )}
    </>
  );
}
