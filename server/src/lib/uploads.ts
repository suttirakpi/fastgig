import fs from "node:fs";
import path from "node:path";

export const AVATAR_DIR = path.resolve(__dirname, "../../uploads/avatars");
export const AVATAR_URL_PREFIX = "/uploads/avatars";

fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ลบไฟล์รูปเก่า (ใช้เฉพาะชื่อไฟล์ กันการอ้าง path แปลก ๆ)
export async function removeAvatarFile(url: string | null | undefined) {
  if (!url || !url.startsWith(`${AVATAR_URL_PREFIX}/`)) return;
  const name = path.basename(url);
  await fs.promises.unlink(path.join(AVATAR_DIR, name)).catch(() => undefined);
}
