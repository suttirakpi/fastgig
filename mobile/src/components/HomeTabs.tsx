import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import { colors } from "../lib/theme";

export type HomeTab = "jobs" | "dashboard";

// แถบแท็บบนหน้าแรก/Dashboard (ตรงกับเว็บ) AI Match จะเปิดในชุดถัดไป
export default function HomeTabs({ active }: { active: HomeTab }) {
  return (
    <View style={styles.tabs}>
      <Pressable onPress={() => router.navigate("/")}>
        <Text
          style={[
            styles.tab,
            active === "jobs" ? styles.tabActive : styles.tabIdle,
          ]}
        >
          งานทั้งหมด
        </Text>
      </Pressable>
      <Text style={[styles.tab, styles.tabOff]}>AI Match</Text>
      <Pressable onPress={() => router.navigate("/dashboard")}>
        <Text
          style={[
            styles.tab,
            active === "dashboard" ? styles.tabActive : styles.tabIdle,
          ]}
        >
          Dashboard
        </Text>
      </Pressable>
      <Pressable style={styles.create} onPress={() => router.push("/jobs/new")}>
        <Text style={styles.createText}>+ สร้างงาน</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 13,
    overflow: "hidden",
  },
  tabActive: { backgroundColor: colors.purple, color: colors.white },
  tabIdle: { backgroundColor: colors.white, color: colors.muted },
  tabOff: { backgroundColor: colors.white, color: colors.muted, opacity: 0.5 },
  create: {
    marginLeft: "auto",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createText: { color: colors.white, fontSize: 13 },
});
