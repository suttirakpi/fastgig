import HomeTabs from "../components/HomeTabs";
import PageHeader from "../components/PageHeader";
import { trustLevel } from "../lib/format";
import { useGet } from "../lib/useGet";
import type { DashboardData } from "../lib/types";

function Stat({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className={`stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading, reload } = useGet<DashboardData>("/dashboard");
  const p = data?.platform;
  const m = data?.mine;

  return (
    <>
      <PageHeader
        title="สรุปงาน (Dashboard)"
        action={
          <button className="chip-btn" onClick={() => void reload()}>
            Refresh
          </button>
        }
      />
      <HomeTabs />

      {loading && !data && <div className="empty">กำลังโหลด...</div>}
      {error && <div className="alert section">{error}</div>}

      {p && m && (
        <>
          <div className="section">
            <h3>ภาพรวมทั้งระบบ</h3>
            <div className="stat-grid">
              <Stat label="งานทั้งหมด" value={p.total} tone="blue" />
              <Stat label="สำเร็จ" value={p.COMPLETED} tone="green" />
            </div>
            <div className="stat-row open">
              <span>เปิดรับ (OPEN)</span>
              <strong>{p.OPEN} งาน</strong>
            </div>
            <div className="stat-row progress">
              <span>กำลังดำเนินการ (IN PROGRESS)</span>
              <strong>{p.IN_PROGRESS} งาน</strong>
            </div>
            <div className="stat-row done">
              <span>สำเร็จ (COMPLETED)</span>
              <strong>{p.COMPLETED} งาน</strong>
            </div>
            <div className="stat-row">
              <span>ผู้ใช้ในระบบ</span>
              <strong>{p.users} คน</strong>
            </div>
          </div>

          <div className="section">
            <h3>งานที่ฉันลง</h3>
            <div className="stat-grid three">
              <Stat label="ทั้งหมด" value={m.posted.total} />
              <Stat label="เปิดรับ" value={m.posted.OPEN} tone="blue" />
              <Stat label="สำเร็จ" value={m.posted.COMPLETED} tone="green" />
            </div>
          </div>

          <div className="section">
            <h3>งานที่ฉันสมัคร</h3>
            <div className="stat-grid three">
              <Stat label="ทั้งหมด" value={m.applications.total} />
              <Stat
                label="รอตอบรับ"
                value={m.applications.PENDING}
                tone="orange"
              />
              <Stat
                label="สำเร็จ"
                value={m.applications.COMPLETED}
                tone="green"
              />
            </div>
          </div>

          <div className="section">
            <h3>ความน่าเชื่อถือของฉัน</h3>
            <div className="stat-grid three">
              <Stat label="Trust Points" value={m.trustPoints} />
              <Stat label="ระดับ" value={trustLevel(m.trustPoints)} />
              <Stat label="งานสำเร็จ" value={m.completedJobs} tone="green" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
