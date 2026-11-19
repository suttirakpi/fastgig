import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api, errorMessage } from "../lib/api";
import type { Job } from "../lib/types";

const CATEGORIES = [
  "ขนของ",
  "ทำความสะอาด",
  "อาหาร",
  "ซ่อมแซม/ช่าง",
  "ขายของ/บริการลูกค้า",
  "อื่น ๆ",
];

type FormState = {
  title: string;
  description: string;
  category: string;
  locationText: string;
  ageMin: string;
  ageMax: string;
  payMin: string;
  payMax: string;
};

export default function CreateJob() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wanted = params.get("category") ?? "";

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: CATEGORIES.includes(wanted) ? wanted : CATEGORIES[0],
    locationText: "",
    ageMin: "",
    ageMax: "",
    payMin: "",
    payMax: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set =
    (key: keyof FormState) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function locateMe() {
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Math.round(pos.coords.latitude * 1e5) / 1e5,
          lng: Math.round(pos.coords.longitude * 1e5) / 1e5,
        });
        setLocating(false);
      },
      () => {
        setError("อ่านตำแหน่งไม่ได้ ตรวจสอบว่าอนุญาตให้เว็บเข้าถึงตำแหน่งแล้ว");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post<{ job: Job }>("/jobs", {
        title: form.title,
        description: form.description,
        category: form.category,
        locationText: form.locationText || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        ageMin: form.ageMin ? Number(form.ageMin) : undefined,
        ageMax: form.ageMax ? Number(form.ageMax) : undefined,
      });
      navigate(`/jobs/${data.job.id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="สร้างงานใหม่" />
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">หัวข้อ</label>
          <input
            id="title"
            className="input"
            placeholder="ระบุหัวข้อ"
            value={form.title}
            onChange={set("title")}
            required
            minLength={3}
          />
        </div>
        <div className="field">
          <label htmlFor="description">รายละเอียด</label>
          <textarea
            id="description"
            className="input"
            placeholder="ระบุรายละเอียดงาน"
            value={form.description}
            onChange={set("description")}
            required
            minLength={5}
          />
        </div>
        <div className="field">
          <label htmlFor="category">ประเภท</label>
          <select
            id="category"
            className="input"
            value={form.category}
            onChange={set("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="location">สถานที่</label>
          <input
            id="location"
            className="input"
            placeholder="ระบุสถานที่"
            value={form.locationText}
            onChange={set("locationText")}
          />
          <div className="photo-actions">
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={locateMe}
              disabled={locating}
            >
              {locating
                ? "กำลังหาตำแหน่ง..."
                : "ใช้ตำแหน่งปัจจุบันเป็นที่ทำงาน"}
            </button>
            {coords && (
              <button
                type="button"
                className="link-btn"
                onClick={() => setCoords(null)}
              >
                บันทึกตำแหน่งแล้ว (ล้าง)
              </button>
            )}
          </div>
          <small className="muted">
            กดตอนอยู่ที่สถานที่ทำงาน เพื่อให้ AI Match คำนวณระยะทางได้
          </small>
        </div>
        <div className="field">
          <label>อายุ</label>
          <div className="row-2">
            <input
              className="input"
              type="number"
              min={15}
              max={100}
              placeholder="อายุต่ำสุด"
              value={form.ageMin}
              onChange={set("ageMin")}
            />
            <input
              className="input"
              type="number"
              min={15}
              max={100}
              placeholder="อายุสูงสุด"
              value={form.ageMax}
              onChange={set("ageMax")}
            />
          </div>
        </div>
        <div className="field">
          <label>ค่าจ้าง (บาท)</label>
          <div className="row-2">
            <input
              className="input"
              type="number"
              min={0}
              placeholder="ค่าจ้างต่ำสุด"
              value={form.payMin}
              onChange={set("payMin")}
              required
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder="ค่าจ้างสูงสุด"
              value={form.payMax}
              onChange={set("payMax")}
              required
            />
          </div>
        </div>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-block" disabled={busy}>
          {busy ? "กำลังโพสต์..." : "โพสต์งาน"}
        </button>
        <button type="button" className="link-btn" onClick={() => navigate(-1)}>
          ยกเลิก
        </button>
      </form>
    </>
  );
}
