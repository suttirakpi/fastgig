import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Text from "./Text";
import type { TextInputProps, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { assetUrl } from "../lib/api";
import { colors, radius } from "../lib/theme";

export function PageHeader({
  title,
  action,
  back = false,
}: {
  title: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.headerLeft}>
        {back && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="ย้อนกลับ"
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function ChipButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, danger && { backgroundColor: colors.danger }]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "danger";
  style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[
        styles.btn,
        variant === "outline" && styles.btnOutline,
        variant === "danger" && { backgroundColor: colors.danger },
        off && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? colors.purple : colors.white}
        />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === "outline" && { color: colors.purple },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  light = false,
  style,
  ...input
}: { label: string; light?: boolean } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, light && { color: colors.white }]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...input}
      />
    </View>
  );
}

export function Avatar({
  name,
  src,
  size = 52,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const uri = assetUrl(src);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.avatar, box]} />;
  return (
    <View
      style={[
        styles.avatar,
        box,
        { alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Text
        style={{
          color: colors.white,
          fontWeight: "700",
          fontSize: size * 0.4,
        }}
      >
        {name.charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

export function Badge({
  label,
  tone = "",
}: {
  label: string;
  tone?: "" | "ok" | "warn" | "bad";
}) {
  const bg =
    tone === "ok"
      ? "#dff5e8"
      : tone === "warn"
        ? "#fff1d6"
        : tone === "bad"
          ? "#fde1e1"
          : "#ece6ff";
  const fg =
    tone === "ok"
      ? "#14753c"
      : tone === "warn"
        ? "#8a5a00"
        : tone === "bad"
          ? "#b42318"
          : colors.purpleDark;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text
        style={{
          color: "#b42318",
          fontSize: 13,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function Notice({ message }: { message: string }) {
  return (
    <View style={styles.notice}>
      <Text
        style={{
          color: colors.purpleDark,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <View style={{ padding: 40, alignItems: "center" }}>
      <Text style={{ color: colors.muted }}>{message}</Text>
    </View>
  );
}

export function Logo() {
  return (
    <View style={{ alignItems: "center", marginBottom: 24 }}>
      <View
        style={{
          borderBottomWidth: 2,
          borderBottomColor: colors.white,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 42,
            fontWeight: "800",
            color: colors.white,
            letterSpacing: 1,
          }}
        >
          FAST<Text style={{ color: colors.gold }}>GIG</Text>
        </Text>
      </View>
      <Text
        style={{
          color: colors.white,
          fontSize: 12,
          marginTop: 6,
        }}
      >
        Welcome to FASTGIG
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  back: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 30,
    marginTop: -4,
  },
  chip: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    color: colors.white,
    fontSize: 12,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.purple,
  },
  btnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "Prompt_400Regular",
  },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: "500", color: colors.purpleDark },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Prompt_400Regular",
    color: colors.text,
  },
  avatar: { backgroundColor: colors.purple, overflow: "hidden" },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  errorBox: { backgroundColor: "#fdecec", borderRadius: 10, padding: 10 },
  notice: { backgroundColor: "#ece6ff", borderRadius: 10, padding: 12 },
});

export const cardStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius,
  padding: 14,
  shadowColor: colors.purpleDeep,
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
