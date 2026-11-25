import { Badge } from "./ui";

const TONE: Record<string, "" | "ok" | "warn" | "bad"> = {
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
  return <Badge label={label} tone={TONE[status] ?? ""} />;
}
