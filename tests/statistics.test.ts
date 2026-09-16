import { describe, it, expect } from "vitest";
import {
  calculateStatistics,
  studentStatistics,
  quantile,
  bandIndex,
} from "../lib/statistics";
import type { StudentRecord } from "../lib/types";
const rows = (marks: number[]): StudentRecord[] =>
  marks.map((mark, i) => ({
    id: String(i),
    registration: `IT 24 1000 ${String(i).padStart(2, "0")}`,
    mark,
    page: 1,
    rowNumber: i + 1,
  }));
describe("class statistics", () => {
  it("calculates the full class summary using population SD and R-7 quartiles", () => {
    const s = calculateStatistics(rows([0, 20, 40, 60, 80, 100]));
    expect(s.count).toBe(6);
    expect(s.mean).toBe(50);
    expect(s.median).toBe(50);
    expect(s.min).toBe(0);
    expect(s.max).toBe(100);
    expect(s.range).toBe(100);
    expect(s.stdDev).toBeCloseTo(34.15650255);
    expect(s.q1).toBe(25);
    expect(s.q3).toBe(75);
    expect(s.iqr).toBe(50);
    expect(s.passCount).toBe(4);
    expect(s.failCount).toBe(2);
    expect(s.passRate).toBeCloseTo(66.666666);
    expect(s.failRate).toBeCloseTo(33.33333);
    expect(s.zeros).toBe(1);
  });
  it("returns multiple modes in sorted order", () => {
    expect(calculateStatistics(rows([70, 40, 70, 40, 20])).modes).toEqual([
      40, 70,
    ]);
  });
  it("has no mode if all marks occur once", () => {
    expect(calculateStatistics(rows([1, 2, 3])).modes).toEqual([]);
  });
  it("keeps a repeated uniform mark as the mode", () => {
    expect(calculateStatistics(rows([45, 45, 45])).modes).toEqual([45]);
  });
  it("handles an odd median and a singleton", () => {
    expect(quantile([1, 4, 9], 0.5)).toBe(4);
    const s = calculateStatistics(rows([82.75]));
    expect(s.q1).toBe(82.75);
    expect(s.q3).toBe(82.75);
    expect(s.stdDev).toBe(0);
    expect(s.range).toBe(0);
  });
  it("excludes zero marks consistently while preserving total and absent count", () => {
    const r = rows([0, 0, 20, 80]);
    const s = calculateStatistics(r, 40, true);
    expect(s.count).toBe(2);
    expect(s.total).toBe(4);
    expect(s.absent).toBe(2);
    expect(s.mean).toBe(50);
    expect(s.passRate).toBe(50);
    expect(s.bands.reduce((n, b) => n + b.count, 0)).toBe(2);
    expect(studentStatistics(r[0], s, 40)).toBeNull();
  });
  it("handles empty and all-absent datasets without NaN", () => {
    for (const r of [[], rows([0, 0])]) {
      const s = calculateStatistics(r, 40, true);
      expect(s.count).toBe(0);
      expect(s.mean).toBeNull();
      expect(s.min).toBeNull();
      expect(s.max).toBeNull();
      expect(s.stdDev).toBeNull();
      expect(s.passRate).toBe(0);
      expect(s.q1).toBeNull();
    }
  });
  it("handles decimal band boundaries without gaps", () => {
    const s = calculateStatistics(
      rows([
        0, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 79.99, 80, 89.99, 90,
        100,
      ]),
    );
    expect(s.bands.map((b) => b.count)).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(s.bands.reduce((n, b) => n + b.percentage, 0)).toBeCloseTo(100);
    expect(bandIndex(100)).toBe(6);
  });
  it("treats equality to a decimal pass threshold as passing", () => {
    const s = calculateStatistics(rows([39.5, 40, 40.5]), 40.5);
    expect(s.passCount).toBe(1);
  });
  it("safely excludes malformed numeric data from calculations", () => {
    expect(calculateStatistics(rows([NaN, Infinity, -1, 101, 50])).count).toBe(
      1,
    );
  });
  it("includes zeros when threshold is zero and absence is off", () => {
    expect(calculateStatistics(rows([0, 20]), 0).passRate).toBe(100);
  });
});
describe("individual statistics", () => {
  it("uses competition ranks and tie-aware midrank percentiles", () => {
    const r = rows([90, 80, 80, 50]);
    const s = calculateStatistics(r);
    const all = r.map((x) => studentStatistics(x, s, 40)!);
    expect(all.map((x) => x.rank)).toEqual([1, 2, 2, 4]);
    expect(all.map((x) => x.percentile)).toEqual([87.5, 50, 50, 12.5]);
    expect(all[1].above).toBe(1);
    expect(all[1].below).toBe(1);
    expect(all[1].tied).toBe(2);
  });
  it("avoids division by zero for uniform marks", () => {
    const r = rows([70, 70]);
    const s = studentStatistics(r[0], calculateStatistics(r), 40)!;
    expect(s.zScore).toBeNull();
    expect(s.percentile).toBe(50);
    expect(s.rank).toBe(1);
  });
  it("calculates difference, z-score, quartile, band and pass status", () => {
    const r = rows([0, 20, 40, 60, 80, 100]);
    const s = studentStatistics(r[4], calculateStatistics(r), 85)!;
    expect(s.difference).toBe(30);
    expect(s.zScore).toBeCloseTo(0.87831);
    expect(s.quartile).toBe(4);
    expect(s.band).toBe("80–89");
    expect(s.passed).toBe(false);
  });
  it("uses rounded-up group size and includes tied ranks in top groups", () => {
    const r = rows(Array.from({ length: 20 }, (_, i) => 100 - i));
    const stats = calculateStatistics(r);
    expect(studentStatistics(r[0], stats, 40)!.top).toEqual([5, 10, 25, 50]);
    expect(studentStatistics(r[1], stats, 40)!.top).toEqual([10, 25, 50]);
    expect(studentStatistics(r[10], stats, 40)!.top).toEqual([]);
  });
  it("rejects a student outside this dataset", () => {
    expect(
      studentStatistics(
        { ...rows([80])[0], id: "unknown" },
        calculateStatistics(rows([80])),
        40,
      ),
    ).toBeNull();
  });
});
