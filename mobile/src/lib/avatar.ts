import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// สร้างฟอร์มอัปโหลดรูปโปรไฟล์ (field ชื่อ avatar ตรงกับ server)
export async function buildAvatarForm(
  asset: ImagePickerAsset,
): Promise<FormData> {
  const type =
    asset.mimeType && ALLOWED.includes(asset.mimeType)
      ? asset.mimeType
      : "image/jpeg";
  const ext =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const name = `avatar.${ext}`;
  const form = new FormData();

  if (Platform.OS === "web") {
    // บนเว็บต้องแปลง uri เป็นไฟล์จริงก่อน
    const blob = await (await fetch(asset.uri)).blob();
    (
      form as unknown as { append(n: string, v: unknown, f?: string): void }
    ).append("avatar", blob, name);
  } else {
    // บนมือถือ React Native รับ { uri, name, type } แทนไฟล์
    form.append("avatar", { uri: asset.uri, name, type } as unknown as Blob);
  }
  return form;
}
