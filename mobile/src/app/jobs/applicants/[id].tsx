import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Text from "../../../components/Text";
import StatusBadge from "../../../components/StatusBadge";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ErrorBox,
  Notice,
  PageHeader,
  cardStyle,
} from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { confirmAction } from "../../../lib/confirm";
import {
  APPLICATION_LABEL,
  JOB_STATUS_LABEL,
  RESULT_LABEL,
  RESULT_POINTS,
  formatPay,
  signed,
  trustLevel,
} from "../../../lib/format";
import { colors } from "../../../lib/theme";
import type { Applicant, Job, WorkResult } from "../../../lib/types";
import { useGet } from "../../../lib/useGet";

const RATINGS: { value: WorkResult; color: string }[] = [
  { value: "PASS", color: colors.ok },
  { value: "FAIR", color: colors.warn },
  { value: "FAIL", color: colors.danger },
];

function Action({
  label,
  color,
  onPress,
  disabled,
}: {
  label: string;
  color: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        { backgroundColor: color },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function Applicants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobQ = useGet<{ job: Job }>(`/jobs/${id}`);
  const appQ = useGet<{ applicants: Applicant[] }>(`/jobs/${id}/applicants`);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");
  const [pulling, setPulling] = useState(false);

  const job = jobQ.data?.job;
  const applicants = appQ.data?.applicants ?? [];
  const busy = busyId !== null;

  async function refresh() {
    await Promise.all([jobQ.reload(), appQ.reload()]);
  }

  async function onPull() {
    setPulling(true);
    await refresh();
    setPulling(false);
  }

  async function decide(
    applicationId: number,
    status: "ACCEPTED" | "REJECTED",
  ) {
    if (
      status === "ACCEPTED" &&
      !(await confirmAction(
        "ยืนยันเลือกคนนี้ทำงาน?",
        "ผู้สมัครคนอื่นจะถูกปฏิเสธอัตโนมัติ",
        "ยอมรับ",
      ))
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
      !(await confirmAction(
        "ยืนยันจบงาน",
        `ผลประเมิน "${label}" แก้ไขภายหลังไม่ได้`,
        "จบงาน",
      ))
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

  const initialLoading = (jobQ.loading || appQ.loading) && !appQ.data;

  return (
    <View style={styles.root}>
      <PageHeader title="รายชื่อผู้สมัคร" back />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => void onPull()}
          />
        }
      >
        {job && (
          <View style={cardStyle}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.row}>
              <StatusBadge
                status={job.status}
                label={JOB_STATUS_LABEL[job.status]}
              />
              <Text style={styles.pay}>
                {formatPay(job.payMin, job.payMax)}
              </Text>
            </View>
          </View>
        )}

        {initialLoading && <Empty message="กำลังโหลด..." />}
        {appQ.error ? <ErrorBox message={appQ.error} /> : null}
        {actionError ? <ErrorBox message={actionError} /> : null}
        {doneMsg ? <Notice message={doneMsg} /> : null}
        {appQ.data && applicants.length === 0 && (
          <Empty message="ยังไม่มีผู้สมัคร" />
        )}

        {applicants.map((a) => (
          <View key={a.id} style={[cardStyle, { gap: 10 }]}>
            <View style={styles.top}>
              <Avatar name={a.user.username} src={a.user.profileImage} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{a.user.username}</Text>
                <View style={styles.row}>
                  <Badge label={trustLevel(a.user.trustPoints)} />
                  <Badge label={`${a.user.trustPoints} pts`} />
                </View>
                <Text style={styles.muted}>
                  อายุ {a.user.age ?? "-"} · งานสำเร็จ {a.user.completedJobs}
                </Text>
                {a.user.skills ? (
                  <Text style={styles.muted}>ทักษะ: {a.user.skills}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.row}>
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
            </View>

            {a.status === "PENDING" && job?.status === "OPEN" && (
              <View style={styles.actions}>
                <Action
                  label="ยอมรับ"
                  color={colors.ok}
                  disabled={busy}
                  onPress={() => void decide(a.id, "ACCEPTED")}
                />
                <Action
                  label="ปฏิเสธ"
                  color={colors.danger}
                  disabled={busy}
                  onPress={() => void decide(a.id, "REJECTED")}
                />
              </View>
            )}

            {a.status === "ACCEPTED" && job?.status === "IN_PROGRESS" && (
              <View style={{ gap: 8 }}>
                <Text style={styles.muted}>
                  งานเสร็จแล้ว? เลือกผลประเมินเพื่อจบงาน
                </Text>
                <View style={styles.actions}>
                  {RATINGS.map((r) => (
                    <Action
                      key={r.value}
                      label={`${RESULT_LABEL[r.value]} (${signed(RESULT_POINTS[r.value])})`}
                      color={r.color}
                      disabled={busy}
                      onPress={() => void complete(a.id, r.value)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        <Button
          label="ย้อนกลับ"
          variant="outline"
          onPress={() => router.back()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.purpleDark,
    marginBottom: 6,
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  pay: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
    color: colors.purpleDark,
  },
  top: { flexDirection: "row", gap: 12 },
  name: { fontSize: 15, fontWeight: "600", color: colors.purpleDark },
  muted: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionText: { color: colors.white, fontSize: 13, fontWeight: "600" },
});
