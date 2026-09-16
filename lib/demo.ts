import type { ExtractionResult } from "./types";
export function demoResults(): ExtractionResult {
  const marks = [
    71.5, 82.75, 62, 91, 55, 48, 76, 68, 84, 0, 72, 63, 57, 39, 88, 94, 67, 72,
    81, 53, 45, 69, 77, 60, 35, 86, 73, 65, 92, 58, 79, 41, 0, 70, 66, 83, 74,
    59, 96, 51, 64, 78, 47, 80, 61, 72, 90, 54, 38, 75, 68, 87, 56, 43, 82, 71,
    63, 49, 85, 69, 77, 52, 93, 66, 74, 31, 0, 60, 89, 70, 46, 78,
  ];
  const records = marks.map((mark, i) => ({
    id: `demo-${i}`,
    registration: `IT 24 ${String(1000 + Math.floor(i / 100)).padStart(4, "0")} ${String(i + 1).padStart(2, "0")}`,
    mark: String(mark),
    rowNumber: i + 1,
    page: Math.floor(i / 24) + 1,
    raw: `${i + 1} | IT 24 1000 ${String(i + 1).padStart(2, "0")} | ${mark}`,
    method: "text" as const,
    notes: [],
  }));
  return {
    records,
    warnings: [],
    pages: [1, 2, 3].map((page) => ({
      page,
      method: "text",
      text: records
        .filter((r) => r.page === page)
        .map((r) => r.raw)
        .join("\n"),
    })),
    totalPages: 3,
  };
}
