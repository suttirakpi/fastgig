function grams(s: string, n = 3): Set<string> {
  const t = s.toLowerCase().replace(/\s+/g, "");
  const out = new Set<string>();
  for (let i = 0; i <= t.length - n; i++) out.add(t.slice(i, i + n));
  if (t.length > 0 && t.length < n) out.add(t);
  return out;
}

/** ความคล้ายแบบไม่ใช้โมเดล (overlap ของตัวอักษร 3 ตัวติดกัน) คืนค่า 0..1 */
export function lexicalSimilarity(a: string, b: string): number {
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / Math.min(A.size, B.size);
}
