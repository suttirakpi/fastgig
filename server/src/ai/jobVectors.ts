import { prisma } from "../lib/prisma";
import { embed, isVector } from "./embeddings";

interface JobTextSource {
  title: string;
  description: string;
  category: string | null;
}

export function jobText(job: JobTextSource): string {
  return [job.title, job.category ?? "", job.description]
    .filter(Boolean)
    .join(". ")
    .slice(0, 600);
}

/** ดึงเวกเตอร์ของงาน ถ้ายังไม่มีให้สร้างแล้วบันทึกลงฐานข้อมูลไว้ใช้ครั้งต่อไป */
export async function getJobVector(
  job: JobTextSource & { id: number; embedding: unknown },
): Promise<number[] | null> {
  if (isVector(job.embedding)) return job.embedding;
  const vec = await embed(jobText(job));
  if (vec) {
    await prisma.job
      .update({ where: { id: job.id }, data: { embedding: vec } })
      .catch(() => undefined);
  }
  return vec;
}
