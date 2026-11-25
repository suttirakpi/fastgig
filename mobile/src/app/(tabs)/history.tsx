import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import Text from "../../components/Text";
import StatusBadge from "../../components/StatusBadge";
import {
  Avatar,
  ChipButton,
  Empty,
  ErrorBox,
  PageHeader,
  cardStyle,
} from "../../components/ui";
import {
  APPLICATION_LABEL,
  JOB_STATUS_LABEL,
  RESULT_LABEL,
  formatAge,
  formatPay,
} from "../../lib/format";
import { colors } from "../../lib/theme";
import type { AppliedItem, MyJob } from "../../lib/types";
import { useGet } from "../../lib/useGet";
import { useRefreshOnFocus } from "../../lib/useRefreshOnFocus";

type Tab = "find" | "mine";

function FindJobsList() {
  const { data, error, loading, reload } = useGet<{
    applications: AppliedItem[];
  }>("/jobs/applied");
  const [pulling, setPulling] = useState(false);
  useRefreshOnFocus(reload);

  async function onRefresh() {
    setPulling(true);
    await reload();
    setPulling(false);
  }

  return (
    <FlatList
      data={data?.applications ?? []}
      keyExtractor={(a) => String(a.id)}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => void onRefresh()}
        />
      }
      ListHeaderComponent={error ? <ErrorBox message={error} /> : undefined}
      ListEmptyComponent={
        loading && !data ? (
          <Empty message="กำลังโหลด..." />
        ) : error ? undefined : (
          <Empty message="ยังไม่เคยสมัครงาน" />
        )
      }
      renderItem={({ item: a }) => (
        <Pressable
          style={cardStyle}
          onPress={() => router.push(`/jobs/${a.job.id}`)}
        >
          <View style={styles.top}>
            <Avatar
              name={a.job.employer?.username ?? "?"}
              src={a.job.employer?.profileImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{a.job.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {a.job.description}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  อายุ: {formatAge(a.job.ageMin, a.job.ageMax)}
                </Text>
                <Text style={styles.pay}>
                  {formatPay(a.job.payMin, a.job.payMax)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.badges}>
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
        </Pressable>
      )}
    />
  );
}

function MyJobsList() {
  const { data, error, loading, reload } = useGet<{ jobs: MyJob[] }>(
    "/jobs/mine",
  );
  const [pulling, setPulling] = useState(false);
  useRefreshOnFocus(reload);

  async function onRefresh() {
    setPulling(true);
    await reload();
    setPulling(false);
  }

  return (
    <FlatList
      data={data?.jobs ?? []}
      keyExtractor={(j) => String(j.id)}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => void onRefresh()}
        />
      }
      ListHeaderComponent={error ? <ErrorBox message={error} /> : undefined}
      ListEmptyComponent={
        loading && !data ? (
          <Empty message="กำลังโหลด..." />
        ) : error ? undefined : (
          <Empty message="ยังไม่เคยลงงาน" />
        )
      }
      renderItem={({ item: job }) => (
        <Pressable
          style={cardStyle}
          onPress={() => router.push(`/jobs/${job.id}`)}
        >
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {job.description}
          </Text>
          <View style={styles.meta}>
            <StatusBadge
              status={job.status}
              label={JOB_STATUS_LABEL[job.status]}
            />
            <Text style={styles.pay}>{formatPay(job.payMin, job.payMax)}</Text>
          </View>
          <View style={styles.badges}>
            {job.pendingApplicants > 0 && (
              <StatusBadge
                status="PENDING"
                label={`รอตอบรับ ${job.pendingApplicants} คน`}
              />
            )}
            <Pressable
              style={styles.manage}
              onPress={() => router.push(`/jobs/applicants/${job.id}`)}
            >
              <Text style={styles.manageText}>ผู้สมัคร / จบงาน ›</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    />
  );
}

export default function History() {
  const [tab, setTab] = useState<Tab>("find");
  const [version, setVersion] = useState(0);

  return (
    <View style={styles.root}>
      <PageHeader
        title="ประวัติ"
        action={
          <ChipButton
            label="Refresh"
            onPress={() => setVersion((v) => v + 1)}
          />
        }
      />
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab("find")}>
          <Text
            style={[
              styles.tab,
              tab === "find" ? styles.tabActive : styles.tabOff,
            ]}
          >
            Find Jobs
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab("mine")}>
          <Text
            style={[
              styles.tab,
              tab === "mine" ? styles.tabActive : styles.tabOff,
            ]}
          >
            My Jobs
          </Text>
        </Pressable>
      </View>
      {tab === "find" ? (
        <FindJobsList key={`f${version}`} />
      ) : (
        <MyJobsList key={`m${version}`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 13,
    overflow: "hidden",
  },
  tabActive: { backgroundColor: colors.purple, color: colors.white },
  tabOff: { backgroundColor: colors.white, color: colors.muted },
  list: { padding: 16, paddingBottom: 110 },
  top: { flexDirection: "row", gap: 12 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.purpleDark,
    marginBottom: 4,
  },
  desc: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: { fontSize: 12, color: colors.muted },
  pay: { fontSize: 14, fontWeight: "600", color: colors.purpleDark },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  manage: {
    marginLeft: "auto",
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageText: { color: colors.white, fontSize: 13 },
});
