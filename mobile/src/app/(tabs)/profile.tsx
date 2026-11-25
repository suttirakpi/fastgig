import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/Text";
import {
  Avatar,
  Badge,
  Button,
  ErrorBox,
  PageHeader,
  cardStyle,
} from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { buildAvatarForm } from "../../lib/avatar";
import { useAuth } from "../../lib/auth";
import { formatDateTime } from "../../lib/format";
import { colors } from "../../lib/theme";
import type { PointsSummary } from "../../lib/types";
import { useGet } from "../../lib/useGet";
import { useRefreshOnFocus } from "../../lib/useRefreshOnFocus";
import { confirmAction } from "../../lib/confirm";

const MAX_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { data: points, error, reload } = useGet<PointsSummary>("/points");
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  useRefreshOnFocus(reload);

  if (!user) return null;

  async function pickPhoto() {
    setPhotoError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_BYTES) {
        setPhotoError("ไฟล์ใหญ่เกิน 5 MB");
        return;
      }

      setBusy(true);
      const form = await buildAvatarForm(asset);
      await api.post("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (data: unknown) => data,
      });
      await refreshUser();
    } catch (err) {
      setPhotoError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!(await confirmAction("ลบรูปโปรไฟล์?", "รูปปัจจุบันจะถูกลบ", "ลบรูป")))
      return;
    setBusy(true);
    setPhotoError("");
    try {
      await api.delete("/users/me/avatar");
      await refreshUser();
    } catch (err) {
      setPhotoError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

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
          <Avatar name={user.username} src={user.profileImage} size={96} />
          <View style={styles.photoActions}>
            <Button
              label={user.profileImage ? "เปลี่ยนรูป" : "เพิ่มรูปโปรไฟล์"}
              variant="outline"
              onPress={() => void pickPhoto()}
              loading={busy}
              style={{ paddingVertical: 8 }}
            />
            {user.profileImage ? (
              <Button
                label="ลบรูป"
                variant="outline"
                onPress={() => void removePhoto()}
                disabled={busy}
                style={{ paddingVertical: 8 }}
              />
            ) : null}
          </View>
          {photoError ? <ErrorBox message={photoError} /> : null}
          <Text style={styles.name}>{user.username}</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Badge label={points?.level ?? "..."} />
            <Badge label={`${points?.trustPoints ?? user.trustPoints} pts`} />
            <Badge
              label={`งานสำเร็จ ${points?.completedJobs ?? user.completedJobs}`}
              tone="ok"
            />
          </View>
        </View>

        {rows.map(([k, v]) => (
          <View key={k} style={[cardStyle, { padding: 10 }]}>
            <Text style={styles.key}>{k}</Text>
            <Text style={{ color: colors.text, fontSize: 14 }}>{v}</Text>
          </View>
        ))}

        <Text style={styles.heading}>ประวัติคะแนน</Text>
        {error ? <ErrorBox message={error} /> : null}
        {points && points.entries.length === 0 && (
          <Text style={styles.key}>ยังไม่มีประวัติคะแนน</Text>
        )}
        {points?.entries.map((e) => (
          <View key={e.id} style={[cardStyle, styles.ledger]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14 }}>
                {e.reason}
              </Text>
              <Text style={styles.key}>{formatDateTime(e.createdAt)}</Text>
            </View>
            <Text
              style={{
                fontWeight: "700",
                color: e.points >= 0 ? colors.ok : colors.danger,
              }}
            >
              {e.points > 0 ? `+${e.points}` : e.points}
            </Text>
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
  heading: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.purpleDark,
    marginTop: 6,
  },
  photoActions: { flexDirection: "row", gap: 8 },
  ledger: { flexDirection: "row", alignItems: "center", gap: 8 },
});
