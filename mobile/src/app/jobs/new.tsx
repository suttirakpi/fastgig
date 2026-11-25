import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Text from "../../components/Text";
import { Button, ErrorBox, Field, PageHeader } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { colors } from "../../lib/theme";
import type { Job } from "../../lib/types";

const CATEGORIES = [
  "ขนของ",
  "ทำความสะอาด",
  "อาหาร",
  "ซ่อมแซม/ช่าง",
  "ขายของ/บริการลูกค้า",
  "อื่น ๆ",
];

interface FormState {
  title: string;
  description: string;
  category: string;
  locationText: string;
  ageMin: string;
  ageMax: string;
  payMin: string;
  payMax: string;
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export default function CreateJob() {
  const params = useLocalSearchParams<{ category?: string }>();
  const wanted = typeof params.category === "string" ? params.category : "";

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: CATEGORIES.includes(wanted) ? wanted : CATEGORIES[0],
    locationText: "",
    ageMin: "",
    ageMax: "",
    payMin: "",
    payMax: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function locateMe() {
    setLocating(true);
    setError("");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setError(
          "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง ไปที่ตั้งค่าของเครื่องเพื่ออนุญาต",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: round5(pos.coords.latitude),
        lng: round5(pos.coords.longitude),
      });
    } catch {
      setError("อ่านตำแหน่งไม่ได้ ตรวจสอบว่าเปิด GPS แล้ว");
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post<{ job: Job }>("/jobs", {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        locationText: form.locationText.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        ageMin: form.ageMin ? Number(form.ageMin) : undefined,
        ageMax: form.ageMax ? Number(form.ageMax) : undefined,
      });
      router.replace(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const ready =
    form.title.trim() && form.description.trim() && form.payMin && form.payMax;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PageHeader title="สร้างงานใหม่" back />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="หัวข้อ"
          placeholder="ระบุหัวข้อ"
          autoCapitalize="sentences"
          value={form.title}
          onChangeText={set("title")}
        />
        <Field
          label="รายละเอียด"
          placeholder="ระบุรายละเอียดงาน"
          autoCapitalize="sentences"
          multiline
          style={styles.multiline}
          value={form.description}
          onChangeText={set("description")}
        />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>ประเภท</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const active = form.category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => set("category")(c)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && { color: colors.white }]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Field
            label="สถานที่"
            placeholder="ระบุสถานที่"
            autoCapitalize="sentences"
            value={form.locationText}
            onChangeText={set("locationText")}
          />
          <Button
            label={
              locating
                ? "กำลังหาตำแหน่ง..."
                : coords
                  ? "บันทึกตำแหน่งแล้ว (กดเพื่ออัปเดต)"
                  : "ใช้ตำแหน่งปัจจุบันเป็นที่ทำงาน"
            }
            variant="outline"
            onPress={() => void locateMe()}
            loading={locating}
          />
          <Text style={styles.hint}>
            กดตอนอยู่ที่สถานที่ทำงาน เพื่อให้ AI Match คำนวณระยะทางได้
          </Text>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field
              label="อายุต่ำสุด"
              placeholder="เช่น 18"
              keyboardType="number-pad"
              value={form.ageMin}
              onChangeText={set("ageMin")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="อายุสูงสุด"
              placeholder="เช่น 35"
              keyboardType="number-pad"
              value={form.ageMax}
              onChangeText={set("ageMax")}
            />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field
              label="ค่าจ้างต่ำสุด (บาท)"
              placeholder="เช่น 300"
              keyboardType="number-pad"
              value={form.payMin}
              onChangeText={set("payMin")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="ค่าจ้างสูงสุด (บาท)"
              placeholder="เช่น 500"
              keyboardType="number-pad"
              value={form.payMax}
              onChangeText={set("payMax")}
            />
          </View>
        </View>

        {error ? <ErrorBox message={error} /> : null}
        <Button
          label="โพสต์งาน"
          onPress={() => void onSubmit()}
          loading={busy}
          disabled={!ready}
        />
        <Button
          label="ยกเลิก"
          variant="outline"
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  label: { fontSize: 13, fontWeight: "500", color: colors.purpleDark },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.purple,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.purple },
  chipText: { fontSize: 13, color: colors.purple },
  hint: { fontSize: 12, color: colors.muted },
  row2: { flexDirection: "row", gap: 10 },
});
