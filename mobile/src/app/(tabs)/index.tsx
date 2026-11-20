import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import JobCard from "../../components/JobCard";
import { ChipButton, Empty, ErrorBox, PageHeader } from "../../components/ui";
import { useGet } from "../../lib/useGet";
import { colors } from "../../lib/theme";
import type { Job } from "../../lib/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [pulling, setPulling] = useState(false);
  const { data, error, loading, reload } = useGet<{
    jobs: Job[];
    total: number;
  }>("/jobs", {
    q: q || undefined,
  });

  async function onRefresh() {
    setPulling(true);
    await reload();
    setPulling(false);
  }

  return (
    <View style={styles.root}>
      <PageHeader
        title="งานทั้งหมด"
        action={<ChipButton label="Refresh" onPress={() => void reload()} />}
      />
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.tabActive]}>งานทั้งหมด</Text>
        <Text style={[styles.tab, styles.tabOff]}>AI Match</Text>
        <Text style={[styles.tab, styles.tabOff]}>Dashboard</Text>
      </View>
      <View style={styles.search}>
        <TextInput
          style={styles.input}
          placeholder="ค้นหางาน เช่น ขนของ, ทาสี"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          returnKeyType="search"
          onSubmitEditing={() => setQ(input.trim())}
        />
      </View>

      <FlatList
        data={data?.jobs ?? []}
        keyExtractor={(job) => String(job.id)}
        renderItem={({ item }) => <JobCard job={item} />}
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
            <Empty message="ยังไม่มีงานที่เปิดรับ" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 13,
    overflow: "hidden",
  },
  tabActive: { backgroundColor: colors.purple, color: colors.white },
  tabOff: { backgroundColor: colors.white, color: colors.muted, opacity: 0.5 },
  search: { paddingHorizontal: 16, paddingTop: 12 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  list: { padding: 16, paddingBottom: 110 },
});
