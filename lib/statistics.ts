import type {
  ClassStatistics,
  StudentRecord,
  StudentStatistics,
} from "./types";
export const BAND_LIMITS = [0, 40, 50, 60, 70, 80, 90, 101];
export const BAND_LABELS = [
  "0–39",
  "40–49",
  "50–59",
  "60–69",
  "70–79",
  "80–89",
  "90–100",
];
export function bandIndex(mark: number) {
  return BAND_LIMITS.findIndex(
    (min, i) => mark >= min && mark < BAND_LIMITS[i + 1],
  );
}
// R-7 linear interpolation: the same convention used by Excel PERCENTILE.INC.
export function quantile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const at = (sorted.length - 1) * p;
  const lower = Math.floor(at);
  return sorted[lower] + (sorted[Math.ceil(at)] - sorted[lower]) * (at - lower);
}
export function calculateStatistics(
  records: StudentRecord[],
  passMark = 40,
  excludeZeros = false,
): ClassStatistics {
  const safe = records.filter(
    (r) => Number.isFinite(r.mark) && r.mark >= 0 && r.mark <= 100,
  );
  const threshold = Number.isFinite(passMark)
    ? Math.min(100, Math.max(0, passMark))
    : 40;
  const included = safe
    .filter((r) => !excludeZeros || r.mark !== 0)
    .sort(
      (a, b) => b.mark - a.mark || a.registration.localeCompare(b.registration),
    );
  const sortedMarks = included.map((r) => r.mark).sort((a, b) => a - b);
  const count = included.length;
  const mean = count ? sortedMarks.reduce((s, x) => s + x, 0) / count : null;
  const q1 = quantile(sortedMarks, 0.25),
    q3 = quantile(sortedMarks, 0.75);
  const frequencies = new Map<number, number>();
  sortedMarks.forEach((x) => frequencies.set(x, (frequencies.get(x) ?? 0) + 1));
  const frequency = Math.max(0, ...frequencies.values());
  const positions = new Map<
    number,
    { above: number; below: number; equal: number }
  >();
  let below = 0;
  for (const [mark, equal] of frequencies) {
    positions.set(mark, { below, equal, above: count - below - equal });
    below += equal;
  }
  const passCount = included.filter((r) => r.mark >= threshold).length;
  const zeros = safe.filter((r) => r.mark === 0).length;
  return {
    positions,
    includedIds: new Set(included.map((r) => r.id)),
    total: safe.length,
    count,
    absent: excludeZeros ? zeros : 0,
    zeros,
    mean,
    median: quantile(sortedMarks, 0.5),
    modes:
      frequency > 1
        ? [...frequencies].filter(([, f]) => f === frequency).map(([x]) => x)
        : [],
    min: count ? sortedMarks[0] : null,
    max: count ? sortedMarks[count - 1] : null,
    range: count ? sortedMarks[count - 1] - sortedMarks[0] : null,
    stdDev:
      mean === null
        ? null
        : Math.sqrt(
            sortedMarks.reduce((s, x) => s + (x - mean) ** 2, 0) / count,
          ),
    q1,
    q3,
    iqr: q1 === null || q3 === null ? null : q3 - q1,
    passCount,
    failCount: count - passCount,
    passRate: count ? (passCount / count) * 100 : 0,
    failRate: count ? ((count - passCount) / count) * 100 : 0,
    sortedMarks,
    included,
    bands: BAND_LABELS.map((label, i) => {
      const n = included.filter((r) => bandIndex(r.mark) === i).length;
      return {
        label,
        min: BAND_LIMITS[i],
        max: BAND_LIMITS[i + 1],
        count: n,
        percentage: count ? (n / count) * 100 : 0,
      };
    }),
  };
}
export function studentStatistics(
  student: StudentRecord,
  stats: ClassStatistics,
  passMark: number,
): StudentStatistics | null {
  if (!stats.includedIds.has(student.id) || stats.mean === null) return null;
  const position = stats.positions.get(student.mark);
  if (!position) return null;
  const { above, below, equal: tied } = position;
  const percentile = ((below + 0.5 * tied) / stats.count) * 100;
  const rank = above + 1;
  return {
    rank,
    tied,
    percentile,
    above,
    below,
    difference: student.mark - stats.mean,
    zScore: stats.stdDev ? (student.mark - stats.mean) / stats.stdDev : null,
    quartile:
      student.mark < stats.q1!
        ? 1
        : student.mark < stats.median!
          ? 2
          : student.mark < stats.q3!
            ? 3
            : 4,
    top: [5, 10, 25, 50].filter(
      (p) => rank <= Math.ceil((stats.count * p) / 100),
    ),
    band: BAND_LABELS[bandIndex(student.mark)],
    passed: student.mark >= passMark,
  };
}
