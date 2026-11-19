import { ALL_KEYWORDS, detectCategories } from "./dictionary";

export type Intent = "FIND_JOB" | "POST_JOB" | "GREETING" | "HELP" | "UNKNOWN";

export interface Analysis {
  intent: Intent;
  categories: string[];
  location: string | null;
}

const POST_RE =
  /ลงงาน|โพสต์งาน|โพสงาน|ลงประกาศ|ประกาศงาน|สร้างงาน|อยากจ้าง|ต้องการจ้าง|จ้างคน|ว่าจ้าง|หาคน|ต้องการคน|รับสมัครคน|หาลูกจ้าง|หาพนักงาน/;
const HELP_RE = /ช่วยอะไร|ทำอะไรได้|ใช้งาน(?:ยังไง|อย่างไร)|วิธีใช้|help/i;
const FIND_RE =
  /หา(?:งาน|รายได้)|อยาก(?:ทำ|ได้งาน|รับงาน)|รับงาน|มีงาน|แนะนำงาน|งาน(?:เสริม|พาร์ท|ด่วน|ใกล้)|รายได้เสริม|ว่าง|ทำงาน|สมัครงาน|ดูงาน|งานทั้งหมด|งานอะไร|หาเงิน|อยากได้เงิน|เงินเพิ่ม/;
const GREET_RE = /^(?:สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีจ้า|hello|hi|hey)/i;

const PARTICLES =
  /(?:หน่อย|ครับ|ค่ะ|คะ|นะ|ด้วย|ได้ไหม|ไหม|หรือเปล่า|จ้า|จ้ะ|เลย|มั้ย|มั๊ย)+$/;
const MARKER_RE = /(?:ใกล้(?:กับ)?|แถว|ย่าน|บริเวณ|ละแวก)\s*([^\n,.!?]{2,30})/;
const PLACE_RE =
  /(มหา(?:ลัย|วิทยาลัย)|ม\.\s?[ก-๙]+|ตลาด[ก-๙]*|โรงพยาบาล[ก-๙]*|ห้าง[ก-๙]*)/;
const CUT_WORDS = [...ALL_KEYWORDS, "หางาน", "ทำงาน", "รับงาน"];

/** ทำให้ชื่อสถานที่เทียบกันได้ เช่น "ม.เกษตร" ~ "มหาลัยเกษตร" ~ "มหาวิทยาลัยเกษตร" */
export function normalizePlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/มหาลัย/g, "มหาวิทยาลัย")
    .replace(/ม\./g, "มหาวิทยาลัย");
}

export function extractLocation(text: string): string | null {
  const m = MARKER_RE.exec(text);
  if (m) {
    let loc = m[1].trim();
    // ตัดส่วนที่เป็นคำบอกประเภทงานออก เช่น "มหาลัยทำอาหาร" -> "มหาลัย"
    let cut = loc.length;
    for (const w of CUT_WORDS) {
      const i = loc.indexOf(w);
      if (i > 0 && i < cut) cut = i;
    }
    loc = loc.slice(0, cut).replace(PARTICLES, "").trim();
    if (loc.length >= 2) return loc;
  }
  const p = PLACE_RE.exec(text);
  return p ? p[1].replace(/\s+/g, "") : null;
}

export function analyze(message: string): Analysis {
  const text = message.trim();
  const categories = detectCategories(text);
  const location = extractLocation(text);

  let intent: Intent = "UNKNOWN";
  if (POST_RE.test(text)) intent = "POST_JOB";
  else if (HELP_RE.test(text)) intent = "HELP";
  else if (FIND_RE.test(text) || categories.length > 0) intent = "FIND_JOB";
  else if (GREET_RE.test(text)) intent = "GREETING";

  return { intent, categories, location };
}
