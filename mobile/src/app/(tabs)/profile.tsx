import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/Text";
import {
  Avatar,
  Badge,
  Button,
  PageHeader,
  cardStyle,
} from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const rows: [string, string][] = [
    ["Email", user.email],
    ["Phone", user.phone ?? "-"],
    ["Age", user.age?.toString() ?? "-"],
    ["Skill", user.skills ?? "-"],
  ];

  return (
    <View style={styles.root}>
      <PageHeader title="โปรไฟล์" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Avatar name={user.username} src={user.profileImage} size={84} />
          <Text style={styles.name}>{user.username}</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Badge label={`${user.trustPoints} pts`} />
            <Badge label={`งานสำเร็จ ${user.completedJobs}`} tone="ok" />
          </View>
        </View>
        {rows.map(([k, v]) => (
          <View key={k} style={[cardStyle, { padding: 10 }]}>
            <Text style={styles.key}>{k}</Text>
            <Text style={{ color: colors.text, fontSize: 14 }}>{v}</Text>
          </View>
        ))}
        <Button
          label="ออกจากระบบ"
          variant="danger"
          onPress={() => void logout()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10, paddingBottom: 110 },
  name: { fontSize: 18, fontWeight: "600", color: colors.purpleDark },
  key: { fontSize: 11, color: colors.muted },
});
