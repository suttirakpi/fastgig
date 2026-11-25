import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import { APPLICATION_LABEL, formatAge, formatPay } from "../lib/format";
import { colors } from "../lib/theme";
import type { Job } from "../lib/types";
import { Avatar, Badge, cardStyle } from "./ui";

export default function JobCard({ job }: { job: Job }) {
  const name = job.employer?.username ?? "";
  return (
    <Pressable style={cardStyle} onPress={() => router.push(`/jobs/${job.id}`)}>
      <View style={styles.top}>
        <Avatar name={name || "?"} src={job.employer?.profileImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {job.description}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              อายุ: {formatAge(job.ageMin, job.ageMax)}
            </Text>
            <Text style={styles.pay}>{formatPay(job.payMin, job.payMax)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.foot}>
        <Text style={styles.metaText}>{name}</Text>
        {job.myApplication && (
          <Badge label={APPLICATION_LABEL[job.myApplication.status]} />
        )}
        <Text style={styles.more}>ดูรายละเอียด ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  foot: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  more: {
    marginLeft: "auto",
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
});
