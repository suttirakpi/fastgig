import { useState } from "react";
import type { FormEvent } from "react";
import HomeTabs from "../components/HomeTabs";
import JobCard from "../components/JobCard";
import PageHeader from "../components/PageHeader";
import { useGet } from "../lib/useGet";
import type { Job } from "../lib/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useGet<{
    jobs: Job[];
    total: number;
  }>("/jobs", {
    q: q || undefined,
  });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setQ(input.trim());
  }

  return (
    <>
      <PageHeader
        title="งานทั้งหมด"
        action={
          <button className="chip-btn" onClick={() => void reload()}>
            Refresh
          </button>
        }
      />
      <HomeTabs />
      <form className="searchbar" onSubmit={onSearch}>
        <input
          className="input"
          placeholder="ค้นหางาน เช่น ขนของ, ทาสี"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-small">ค้นหา</button>
      </form>

      <div className="list">
        {loading && !data && <div className="empty">กำลังโหลด...</div>}
        {error && <div className="alert">{error}</div>}
        {data && data.jobs.length === 0 && (
          <div className="empty">ยังไม่มีงานที่เปิดรับ</div>
        )}
        {data?.jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </>
  );
}
