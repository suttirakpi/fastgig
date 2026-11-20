import { Link } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, ErrorBox, Field, Logo } from "../components/ui";
import { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors } from "../lib/theme";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
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
            label="Email"
            light
            placeholder="Enter Your Email"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            light
            placeholder="Enter Your Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void onSubmit()}
          />
          {error ? <ErrorBox message={error} /> : null}
          <Button
            label="Continue"
            onPress={() => void onSubmit()}
            loading={busy}
            disabled={!email || !password}
          />
        </View>
        <Text style={styles.switch}>
          Don't have an account?{" "}
          <Link href="/register" style={styles.link}>
            Sign Up
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
    fontSize: 13,
  },
  link: { color: colors.gold, fontWeight: "600" },
});
