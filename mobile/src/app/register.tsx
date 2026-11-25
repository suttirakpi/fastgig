import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import Text from "../components/Text";
import { Button, ErrorBox, Field, Logo } from "../components/ui";
import { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RegisterInput } from "../lib/auth";
import { colors } from "../lib/theme";

const empty: RegisterInput = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  age: "",
  skill: "",
};

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterInput>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof RegisterInput) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit() {
    setError("");
    setBusy(true);
    try {
      await register({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Logo />
        <View style={styles.form}>
          <Field
            label="Username"
            light
            placeholder="Create Your User name"
            value={form.username}
            onChangeText={set("username")}
          />
          <Field
            label="Email"
            light
            placeholder="Create Your Email"
            keyboardType="email-address"
            value={form.email}
            onChangeText={set("email")}
          />
          <Field
            label="Password"
            light
            placeholder="อย่างน้อย 8 ตัวอักษร"
            secureTextEntry
            value={form.password}
            onChangeText={set("password")}
          />
          <Field
            label="Confirm Password"
            light
            placeholder="Confirm Your Password"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={set("confirmPassword")}
          />
          <Field
            label="Phone"
            light
            placeholder="Enter Your Phone Number"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={set("phone")}
          />
          <Field
            label="Age"
            light
            placeholder="Enter Your Age"
            keyboardType="number-pad"
            value={form.age}
            onChangeText={set("age")}
          />
          <Field
            label="Skill"
            light
            placeholder="เช่น ทำความสะอาด, ขนของ, ทำอาหาร"
            value={form.skill}
            onChangeText={set("skill")}
            autoCapitalize="sentences"
          />
          {error ? <ErrorBox message={error} /> : null}
          <Button
            label="Continue"
            onPress={() => void onSubmit()}
            loading={busy}
            disabled={
              !form.username ||
              !form.email ||
              !form.password ||
              !form.confirmPassword
            }
          />
        </View>
        <Text style={styles.switch}>
          Do You Have Account?{" "}
          <Link href="/login" style={styles.link}>
            Sign In
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.purple },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  form: { gap: 12 },
  switch: {
    color: colors.white,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    fontSize: 13,
  },
  link: { color: colors.gold, fontWeight: "600" },
});
