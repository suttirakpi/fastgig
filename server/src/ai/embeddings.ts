const RETRY_AFTER_MS = 60_000;
const CACHE_MAX = 300;

interface Extractor {
  (
    text: string,
    options: { pooling: "mean"; normalize: boolean },
  ): Promise<{ data: ArrayLike<number> }>;
}
type PipelineFn = (
  task: string,
  model: string,
  options?: Record<string, unknown>,
) => Promise<Extractor>;

export type ModelStatus = "ready" | "loading" | "unavailable";

let extractor: Extractor | null = null;
let loading: Promise<void> | null = null;
let failedAt = 0;
const cache = new Map<string, number[]>();

async function loadExtractor(): Promise<Extractor | null> {
  // อ่านค่าตอนโหลดโมเดล (หลัง dotenv โหลด .env แล้ว)
  const modelId =
    process.env.EMBEDDING_MODEL ??
    "Xenova/distiluse-base-multilingual-cased-v2";
  const dtype = process.env.EMBEDDING_DTYPE ?? "q8";
  try {
    const mod = (await import("@huggingface/transformers")) as unknown as {
      pipeline: PipelineFn;
    };
    console.log(
      `[ai] กำลังโหลดโมเดล ${modelId} (ครั้งแรกจะดาวน์โหลดไฟล์ ใช้เวลาสักครู่)...`,
    );
    const ex = await mod.pipeline("feature-extraction", modelId, { dtype });
    console.log("[ai] โหลดโมเดลสำเร็จ");
    return ex;
  } catch (err) {
    console.error(
      "[ai] โหลดโมเดลไม่สำเร็จ จะใช้การจับคู่ด้วยคำสำคัญแทนชั่วคราว:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ไม่รอโมเดลโหลด: ถ้ายังไม่พร้อมให้เริ่มโหลดเบื้องหลังแล้วคืน null (ผู้เรียกใช้ตัวสำรองแทน)
function getExtractor(): Extractor | null {
  if (extractor) return extractor;
  const coolingDown = failedAt > 0 && Date.now() - failedAt < RETRY_AFTER_MS;
  if (!loading && !coolingDown) {
    loading = loadExtractor().then((ex) => {
      extractor = ex;
      failedAt = ex ? 0 : Date.now();
      loading = null;
    });
  }
  return null;
}

export function modelStatus(): ModelStatus {
  if (extractor) return "ready";
  if (loading) return "loading";
  return "unavailable";
}

/** เรียกตอนเริ่มเซิร์ฟเวอร์ เพื่อโหลดโมเดลล่วงหน้า */
export function warmUp(): void {
  getExtractor();
}

/** แปลงข้อความเป็นเวกเตอร์ (null = โมเดลยังไม่พร้อม/ใช้ไม่ได้) */
export async function embed(text: string): Promise<number[] | null> {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 600);
  if (!clean) return null;

  const hit = cache.get(clean);
  if (hit) return hit;

  const ex = getExtractor();
  if (!ex) return null;

  try {
    const out = await ex(clean, { pooling: "mean", normalize: true });
    const vec = Array.from(out.data, (v) => Math.round(v * 1e5) / 1e5);
    if (cache.size >= CACHE_MAX)
      cache.delete(cache.keys().next().value as string);
    cache.set(clean, vec);
    return vec;
  } catch (err) {
    console.error(
      "[ai] สร้างเวกเตอร์ไม่สำเร็จ:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function isVector(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((n) => typeof n === "number")
  );
}
