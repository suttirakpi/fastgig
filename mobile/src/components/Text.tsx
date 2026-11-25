import { StyleSheet, Text as RNText } from "react-native";
import type { TextProps } from "react-native";

const FAMILY: Record<string, string> = {
  normal: "Prompt_400Regular",
  "400": "Prompt_400Regular",
  "500": "Prompt_500Medium",
  "600": "Prompt_600SemiBold",
  "700": "Prompt_700Bold",
  "800": "Prompt_700Bold",
  bold: "Prompt_700Bold",
};

export default function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontFamily = FAMILY[String(flat.fontWeight ?? "400")] ?? FAMILY["400"];
  return (
    <RNText
      {...props}
      style={[{ fontFamily }, style, { fontWeight: undefined }]}
    />
  );
}
