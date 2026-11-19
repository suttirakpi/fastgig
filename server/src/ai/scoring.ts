// สูตรตามเปเปอร์: Total = 0.65 x Semantic + 0.25 x Category + 0.10 x Distance
export const WEIGHTS = {
  semantic: 0.65,
  category: 0.25,
  distance: 0.1,
} as const;

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function totalScore(s: {
  semantic: number;
  category: number;
  distance: number;
}) {
  return (
    WEIGHTS.semantic * s.semantic +
    WEIGHTS.category * s.category +
    WEIGHTS.distance * s.distance
  );
}
