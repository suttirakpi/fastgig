export function trustLevel(points: number) {
  if (points >= 100) return "Pro";
  if (points >= 50) return "Trusted";
  if (points >= 10) return "Basic";
  return "Newbie";
}
