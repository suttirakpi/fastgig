import { Alert, Platform } from "react-native";

// กล่องยืนยัน: มือถือใช้ Alert, เบราว์เซอร์ใช้ window.confirm (Alert ไม่ทำงานบนเว็บ)
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = "ยืนยัน",
): Promise<boolean> {
  if (Platform.OS === "web") {
    const ask = (
      globalThis as unknown as { confirm?: (text: string) => boolean }
    ).confirm;
    return Promise.resolve(ask ? ask(`${title}\n${message}`) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "ยกเลิก", style: "cancel", onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
