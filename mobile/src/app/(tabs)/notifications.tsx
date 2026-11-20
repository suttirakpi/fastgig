import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import {
  ChipButton,
  Empty,
  ErrorBox,
  PageHeader,
  cardStyle,
} from "../../components/ui";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { colors } from "../../lib/theme";
import { useGet } from "../../lib/useGet";

interface NotificationItem {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { data, error, loading, reload } = useGet<{
    notifications: NotificationItem[];
    unread: number;
  }>("/notifications");
  const [pulling, setPulling] = useState(false);

  async function markAllRead() {
    await api.post("/notifications/read-all");
    await reload();
  }

  async function onRefresh() {
    setPulling(true);
    await reload();
    setPulling(false);
  }

  return (
    <View style={styles.root}>
      <PageHeader
        title="แจ้งเตือน"
        action={
          data && data.unread > 0 ? (
            <ChipButton
              label={`อ่านทั้งหมด (${data.unread})`}
              onPress={() => void markAllRead()}
            />
          ) : undefined
        }
      />
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
            <Empty message="No Data" />
          )
        }
        renderItem={({ item }) => (
          <View
            style={[
              cardStyle,
              {
                borderLeftWidth: 4,
                borderLeftColor: item.isRead ? "transparent" : colors.accent,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontSize: 14 }}>
              {item.content}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 110 },
});
