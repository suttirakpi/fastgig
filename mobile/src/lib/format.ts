const nf = new Intl.NumberFormat("th-TH");

export function formatPay(min: number, max: number) {
  return min === max
    ? `${nf.format(min)} บาท`
    : `${nf.format(min)} - ${nf.format(max)} บาท`;
}

export function formatAge(min: number | null, max: number | null) {
  if (min == null && max == null) return "ไม่จำกัดอายุ";
  if (min != null && max != null) return `${min} - ${max} ปี`;
  if (min != null) return `${min} ปีขึ้นไป`;
  return `ไม่เกิน ${max} ปี`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const APPLICATION_LABEL: Record<string, string> = {
  PENDING: "รอการตอบรับ",
  ACCEPTED: "ได้รับเลือกแล้ว",
  REJECTED: "ไม่ได้รับเลือก",
  COMPLETED: "เสร็จสิ้น",
};

export const JOB_STATUS_LABEL: Record<string, string> = {
  OPEN: "เปิดรับสมัคร",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export const RESULT_LABEL: Record<string, string> = {
  PASS: "ผ่าน",
  FAIR: "พอใช้",
  FAIL: "ไม่ผ่าน",
};

export const RESULT_POINTS: Record<string, number> = {
  PASS: 10,
  FAIR: 5,
  FAIL: -5,
};

export function signed(n: number) {
  return n > 0 ? `+${n}` : String(n);
}

// เกณฑ์ระดับเดียวกับ server (server/src/lib/trust.ts)
export function trustLevel(points: number) {
  if (points >= 100) return "Pro";
  if (points >= 50) return "Trusted";
  if (points >= 10) return "Basic";
  return "Newbie";
}
