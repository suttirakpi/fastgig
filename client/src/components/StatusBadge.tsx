const TONE: Record<string, string> = {
  OPEN: "",
  PENDING: "warn",
  ACCEPTED: "ok",
  IN_PROGRESS: "warn",
  COMPLETED: "ok",
  REJECTED: "bad",
  CANCELLED: "bad",
  PASS: "ok",
  FAIR: "warn",
  FAIL: "bad",
};

export default function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return <span className={`badge ${TONE[status] ?? ""}`}>{label}</span>;
}
