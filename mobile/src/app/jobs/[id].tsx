import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ErrorBox,
  Notice,
  PageHeader,
  cardStyle,
} from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { APPLICATION_LABEL, formatAge, formatPay } from "../../lib/format";
import { colors } from "../../lib/theme";
import type { Job } from "../../lib/types";
import { useGet } from "../../lib/useGet";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data, error, loading, reload } = useGet<{ job: Job }>(`/jobs/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function apply() {
    setBusy(true);
    setActionError("");
    try {
      await api.post(`/jobs/${id}/apply`);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const job = data?.job;

  return (
    <View style={styles.root}>
      <PageHeader title="รายละเอียดงาน" back />
      <ScrollView contentContainerStyle={styles.content}>
        {loading && !job && <Empty message="กำลังโหลด..." />}
        {error ? <ErrorBox message={error} /> : null}

        {job && (
          <>
            <View style={{ alignItems: "center", gap: 6 }}>
              <Avatar
                name={job.employer?.username ?? "?"}
                src={job.employer?.profileImage}
                size={84}
              />
              <Text style={styles.muted}>
                ผู้ลงงาน: {job.employer?.username}
              </Text>
              <Text style={styles.title}>{job.title}</Text>
              <View style={styles.pills}>
                <Text style={styles.pill}>{job.category ?? "ทั่วไป"}</Text>
                <Text style={styles.pill}>
                  {formatPay(job.payMin, job.payMax)}
                </Text>
                <Text style={styles.pill}>
                  อายุ {formatAge(job.ageMin, job.ageMax)}
                </Text>
              </View>
              {job.locationText ? (
                <Text style={styles.muted}>สถานที่: {job.locationText}</Text>
              ) : null}
            </View>

            <View>
              <Text style={styles.section}>Description</Text>
              <View style={[cardStyle, { minHeight: 120 }]}>
                <Text
                  style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}
                >
                  {job.description}
                </Text>
              </View>
            </View>

            {actionError ? <ErrorBox message={actionError} /> : null}
            {job.employerId === user?.id ? (
              <Notice message="นี่คืองานที่คุณลงเอง (หน้าจัดการผู้สมัครจะเพิ่มในขั้นถัดไป)" />
            ) : job.myApplication ? (
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={styles.muted}>สถานะการสมัคร</Text>
                <Badge label={APPLICATION_LABEL[job.myApplication.status]} />
              </View>
            ) : job.status !== "OPEN" ? (
              <Notice message="งานนี้ปิดรับสมัครแล้ว" />
            ) : (
              <Button
                label="รับงาน"
                onPress={() => void apply()}
                loading={busy}
              />
            )}
            <Button
              label="ย้อนกลับ"
              variant="outline"
              onPress={() => router.back()}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  muted: { color: colors.muted, fontSize: 13 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.purpleDark,
    textAlign: "center",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  pill: {
    backgroundColor: colors.accent,
    color: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    overflow: "hidden",
  },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.purpleDark,
    marginBottom: 6,
  },
});
