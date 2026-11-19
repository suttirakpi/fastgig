import { Link } from "react-router-dom";
import { APPLICATION_LABEL, formatAge, formatPay } from "../lib/format";
import type { Job } from "../lib/types";
import Avatar from "../components/Avatar";

export default function JobCard({ job }: { job: Job }) {
  const name = job.employer?.username ?? "";
  return (
    <article className="card">
      <div className="job-card-top">
        <Avatar name={name} src={job.employer?.profileImage} />
        <div className="job-card-body">
          <h3>{job.title}</h3>
          <p className="clamp">{job.description}</p>
          <div className="job-meta">
            <span>อายุ: {formatAge(job.ageMin, job.ageMax)}</span>
            <strong>{formatPay(job.payMin, job.payMax)}</strong>
          </div>
        </div>
      </div>
      <div className="job-card-foot">
        <span>{name}</span>
        {job.myApplication && (
          <span className="badge">
            {APPLICATION_LABEL[job.myApplication.status]}
          </span>
        )}
        <Link className="btn btn-small" to={`/jobs/${job.id}`}>
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
