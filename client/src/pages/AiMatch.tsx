import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import HomeTabs from "../components/HomeTabs";
import PageHeader from "../components/PageHeader";
import { formatPay } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { MatchResponse, MatchedJob } from "../lib/types";

const RADIUS_OPTIONS = [3, 5, 10, 20];

function Bar({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${Math.max(2, value)}%` }} />
      </div>
      <span className="bar-value">{note ?? `${value}%`}</span>
    </div>
  );
}

function MatchCard({ job }: { job: MatchedJob }) {
  const m = job.match;
  const name = job.employer?.username ?? "";
  return (
    <article className="card">
      <div className="job-card-top">
        <Avatar name={name || "?"} src={job.employer?.profileImage} />
        <div className="job-card-body">
          <div className="match-head">
            <h3>{job.title}</h3>
            <span className="match-score">ตรง {m.score}%</span>
          </div>
          <p className="clamp">{job.description}</p>
          <div className="job-meta">
            <span>{job.category ?? "ทั่วไป"}</span>
            <strong>{formatPay(job.payMin, job.payMax)}</strong>
          </div>
        </div>
      </div>
      <div className="match-bars">
        <Bar label="ความหมาย" value={m.semantic} />
        <Bar label="ประเภทงาน" value={m.category} />
        <Bar
          label="ระยะทาง"
          value={m.distance}
          note={m.distanceKm === null ? "ไม่ทราบ" : `${m.distanceKm} กม.`}
        />
      </div>
      <div className="job-card-foot">
        <span>{name}</span>
        <Link className="btn btn-small" to={`/jobs/${job.id}`}>
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}

export default function AiMatch() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [radius, setRadius] = useState(10);

  const { data, error, loading, reload } = useGet<MatchResponse>("/match", {
    lat: coords?.lat,
    lng: coords?.lng,
    radius,
  });

  function locateMe() {
    if (!navigator.geolocation) {
      setGeoError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(
          "อ่านตำแหน่งไม่ได้ ตรวจสอบว่าอนุญาตให้เว็บเข้าถึงตำแหน่งแล้ว",
        );
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  let hint = "";
  if (data) {
    if (data.modelStatus === "loading") {
      hint =
        "โมเดล AI กำลังโหลด (ครั้งแรกอาจใช้เวลาสักครู่) ตอนนี้ใช้การจับคู่ด้วยคำสำคัญไปก่อน ลองกด Refresh อีกครั้งภายหลัง";
    } else if (data.engine === "keyword") {
      hint = "โมเดล AI ใช้งานไม่ได้ในขณะนี้ จึงจับคู่ด้วยคำสำคัญแทน";
    } else if (!data.hasProfile) {
      hint =
        "ยังไม่มีทักษะในโปรไฟล์หรือประวัติสมัครงาน คะแนนความหมายจึงยังเป็นค่ากลาง";
    }
  }

  return (
    <>
      <PageHeader
        title="AI Match"
        action={
          <button className="chip-btn" onClick={() => void reload()}>
            Refresh
          </button>
        }
      />
      <HomeTabs />

      <div className="match-controls">
        <button
          className="btn btn-small btn-outline"
          onClick={locateMe}
          disabled={locating}
        >
          {locating
            ? "กำลังหาตำแหน่ง..."
            : coords
              ? "อัปเดตตำแหน่งของฉัน"
              : "ใช้ตำแหน่งของฉัน"}
        </button>
        <label className="radius">
          รัศมี
          <select
            className="input"
            value={radius}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setRadius(Number(e.target.value))
            }
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} กม.
              </option>
            ))}
          </select>
        </label>
      </div>
      {geoError && <div className="alert section">{geoError}</div>}
      {hint && <div className="notice section">{hint}</div>}
      {data && (
        <p className="muted section formula">
          สูตร: {data.weights.semantic} × ความหมาย + {data.weights.category} ×
          ประเภท + {data.weights.distance} × ระยะทาง
        </p>
      )}

      <div className="list">
        {loading && !data && (
          <div className="empty">กำลังวิเคราะห์งานที่เหมาะกับคุณ...</div>
        )}
        {error && <div className="alert">{error}</div>}
        {data && data.jobs.length === 0 && (
          <div className="empty">ยังไม่มีงานที่เหมาะสมในตอนนี้</div>
        )}
        {data?.jobs.map((job) => (
          <MatchCard key={job.id} job={job} />
        ))}
      </div>
    </>
  );
}
