import { analyze } from "./nlu";
import type { Intent } from "./nlu";

interface Case {
  text: string;
  intent: Intent;
  category?: string;
  location?: string;
}

const cases: Case[] = [
  { text: "หางานทำอาหาร", intent: "FIND_JOB", category: "อาหาร" },
  {
    text: "อยากขนของไกลๆ ม.เกษตร",
    intent: "FIND_JOB",
    category: "ขนของ",
    location: "ม.เกษตร",
  },
  {
    text: "ทำงานร้านกาแฟ",
    intent: "FIND_JOB",
    category: "ขายของ/บริการลูกค้า",
  },
  {
    text: "อยากเป็นแคชเชียร์",
    intent: "FIND_JOB",
    category: "ขายของ/บริการลูกค้า",
  },
  { text: "มีงานล้างจานไหม", intent: "FIND_JOB", category: "อาหาร" },
  {
    text: "หางานพาร์ทไทม์แถวมหาลัยหน่อย",
    intent: "FIND_JOB",
    location: "มหาลัย",
  },
  { text: "อยากได้งานเสริมช่วงเสาร์อาทิตย์", intent: "FIND_JOB" },
  { text: "ขอรายได้เสริมสักหน่อย", intent: "FIND_JOB" },
  {
    text: "มีงานทาสีบ้านไหมครับ",
    intent: "FIND_JOB",
    category: "ซ่อมแซม/ช่าง",
  },
  {
    text: "หางานซักผ้ารีดผ้าใกล้บ้าน",
    intent: "FIND_JOB",
    category: "ทำความสะอาด",
    location: "บ้าน",
  },
  { text: "ว่างวันอาทิตย์ มีอะไรให้ทำบ้าง", intent: "FIND_JOB" },
  { text: "อยากแบกของย้ายหอ", intent: "FIND_JOB", category: "ขนของ" },
  { text: "ขนม", intent: "FIND_JOB", category: "อาหาร" },
  { text: "อยากลงงาน", intent: "POST_JOB" },
  { text: "หาคนช่วยยกของ", intent: "POST_JOB", category: "ขนของ" },
  {
    text: "อยากจ้างคนทำความสะอาดบ้าน",
    intent: "POST_JOB",
    category: "ทำความสะอาด",
  },
  {
    text: "โพสต์งานขายของหน้าร้านได้ไหม",
    intent: "POST_JOB",
    category: "ขายของ/บริการลูกค้า",
  },
  { text: "ต้องการคนล้างจานช่วงเย็น", intent: "POST_JOB", category: "อาหาร" },
  { text: "สร้างงานใหม่", intent: "POST_JOB" },
  { text: "สวัสดีครับ", intent: "GREETING" },
  { text: "hello", intent: "GREETING" },
  { text: "ช่วยอะไรได้บ้าง", intent: "HELP" },
  { text: "ใช้งานยังไง", intent: "HELP" },
  { text: "ขอบคุณมาก", intent: "UNKNOWN" },
  { text: "วันนี้ฝนตกไหม", intent: "UNKNOWN" },
  { text: "หางานอะไรก็ได้", intent: "FIND_JOB" },
  { text: "สวัสดีครับ อยากหางานขนของ", intent: "FIND_JOB", category: "ขนของ" },
  { text: "ลงงานทาสีรั้ว", intent: "POST_JOB", category: "ซ่อมแซม/ช่าง" },
  { text: "อยากหาคนมาล้างรถ", intent: "POST_JOB", category: "ทำความสะอาด" },
  { text: "แนะนำงานใกล้ตลาดหน่อย", intent: "FIND_JOB", location: "ตลาด" },
  { text: "ขอดูงานทั้งหมด", intent: "FIND_JOB" },
  { text: "อยากได้เงินเพิ่มช่วงปิดเทอม", intent: "FIND_JOB" },
];

let intentOk = 0;
let entityOk = 0;
let entityTotal = 0;

for (const c of cases) {
  const r = analyze(c.text);
  const okIntent = r.intent === c.intent;
  if (okIntent) intentOk++;

  const problems: string[] = [];
  if (!okIntent) problems.push(`intent ได้ ${r.intent} (ควรเป็น ${c.intent})`);
  if (c.category) {
    entityTotal++;
    if (r.categories[0] === c.category) entityOk++;
    else
      problems.push(
        `หมวดได้ ${r.categories[0] ?? "-"} (ควรเป็น ${c.category})`,
      );
  }
  if (c.location) {
    entityTotal++;
    if (r.location === c.location) entityOk++;
    else
      problems.push(`สถานที่ได้ ${r.location ?? "-"} (ควรเป็น ${c.location})`);
  }
  if (problems.length) console.log(`✗ "${c.text}" -> ${problems.join(" | ")}`);
}

const pct = (a: number, b: number) =>
  `${a}/${b} (${Math.round((a / b) * 100)}%)`;
console.log(`\nIntent ถูกต้อง: ${pct(intentOk, cases.length)}`);
console.log(`Entity (หมวด/สถานที่) ถูกต้อง: ${pct(entityOk, entityTotal)}`);
