import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";
import Text from "../../components/Text";
import HomeTabs from "../../components/HomeTabs";
import { ChipButton, Empty, ErrorBox, PageHeader } from "../../components/ui";
import { trustLevel } from "../../lib/format";
import { colors } from "../../lib/theme";
import type { DashboardData } from "../../lib/types";
import { useGet } from "../../lib/useGet";
import { useRefreshOnFocus } from "../../lib/useRefreshOnFocus";

function Stat({
  label,
  value,
  color = colors.purple,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.rowBox, { borderColor: color }]}>
      <Text style={{ color, fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontSize: 14, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

const BLUE = "#2f6bed";
const ORANGE_TEXT = "#b36b00";

export default function Dashboard() {
  const { data, error, loading, reload } = useGet<DashboardData>("/dashboard");
  const [pulling, setPulling] = useState(false);
  useRefreshOnFocus(reload);

  async function onPull() {
    setPulling(true);
    await reload();
    setPulling(false);
  }

  const p = data?.platform;
  const m = data?.mine;

  return (
    <View style={styles.root}>
      <PageHeader
        title="สรุปงาน (Dashboard)"
        action={<ChipButton label="Refresh" onPress={() => void reload()} />}
      />
      <HomeTabs active="dashboard" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => void onPull()}
          />
        }
      >
        {loading && !data && <Empty message="กำลังโหลด..." />}
        {error ? <ErrorBox message={error} /> : null}

        {p && m && (
          <>
            <Text style={styles.heading}>ภาพรวมทั้งระบบ</Text>
            <View style={styles.grid}>
              <Stat label="งานทั้งหมด" value={p.total} color={BLUE} />
              <Stat label="สำเร็จ" value={p.COMPLETED} color={colors.ok} />
            </View>
            <Row label="เปิดรับ (OPEN)" value={`${p.OPEN} งาน`} color={BLUE} />
            <Row
              label="กำลังดำเนินการ (IN PROGRESS)"
              value={`${p.IN_PROGRESS} งาน`}
              color={ORANGE_TEXT}
            />
            <Row
              label="สำเร็จ (COMPLETED)"
              value={`${p.COMPLETED} งาน`}
              color={colors.ok}
            />
            <Row
              label="ผู้ใช้ในระบบ"
              value={`${p.users} คน`}
              color={colors.muted}
            />

            <Text style={styles.heading}>งานที่ฉันลง</Text>
            <View style={styles.grid}>
              <Stat label="ทั้งหมด" value={m.posted.total} />
              <Stat label="เปิดรับ" value={m.posted.OPEN} color={BLUE} />
              <Stat
                label="สำเร็จ"
                value={m.posted.COMPLETED}
                color={colors.ok}
              />
            </View>

            <Text style={styles.heading}>งานที่ฉันสมัคร</Text>
            <View style={styles.grid}>
              <Stat label="ทั้งหมด" value={m.applications.total} />
              <Stat
                label="รอตอบรับ"
                value={m.applications.PENDING}
                color={colors.warn}
              />
              <Stat
                label="สำเร็จ"
                value={m.applications.COMPLETED}
                color={colors.ok}
              />
            </View>

            <Text style={styles.heading}>ความน่าเชื่อถือของฉัน</Text>
            <View style={styles.grid}>
              <Stat label="Trust Points" value={m.trustPoints} />
              <Stat label="ระดับ" value={trustLevel(m.trustPoints)} />
              <Stat
                label="งานสำเร็จ"
                value={m.completedJobs}
                color={colors.ok}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10, paddingBottom: 110 },
  heading: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.purpleDark,
    marginTop: 6,
  },
  grid: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderRadius: 14, padding: 14, gap: 2 },
  statValue: { color: colors.white, fontSize: 24, fontWeight: "700" },
  statLabel: { color: colors.white, fontSize: 12, opacity: 0.9 },
  rowBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
