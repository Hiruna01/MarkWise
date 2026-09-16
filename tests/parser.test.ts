import { describe, it, expect } from "vitest";
import { parseLines, sequenceWarnings, textItemsToLines } from "../lib/parser";
import { normalizeRegistration, registrationKey } from "../lib/normalization";
import { validateRecords, validateDraft } from "../lib/validation";
import { toCsv } from "../lib/export";
describe("normalization", () => {
  it.each([
    "IT24100007",
    "it 24 1000 07",
    "IT-24-1000-07",
    " IT  24   1000  07 ",
  ])("normalizes %s", (value) => {
    expect(normalizeRegistration(value)).toBe("IT 24 1000 07");
    expect(registrationKey(value)).toBe("IT24100007");
  });
  it("preserves leading zeros", () =>
    expect(normalizeRegistration("IT01000203")).toBe("IT 01 0002 03"));
  it("does not invent digits", () =>
    expect(normalizeRegistration("IT123")).toBe("IT123"));
});
describe("row parser", () => {
  it("extracts decimal and integer marks with page provenance", () => {
    const p = parseLines(
      [
        "1 | IT 23 3616 90 | 71.5",
        "2 | IT 24 1000 07 | 82.75",
        "3 | IT 24 1000 12 | 62",
      ],
      2,
    );
    expect(p.records.map((r) => r.mark)).toEqual(["71.5", "82.75", "62"]);
    expect(p.records.map((r) => r.rowNumber)).toEqual([1, 2, 3]);
    expect(p.records.every((r) => r.page === 2)).toBe(true);
    expect(validateRecords(p.records).errors.size).toBe(0);
  });
  it("accepts inconsistent spacing and hyphens", () => {
    expect(
      parseLines(["1 IT24100007 82.75", "2 it-24-1000-12 62"], 1).records.map(
        (r) => r.registration,
      ),
    ).toEqual(["IT 24 1000 07", "IT 24 1000 12"]);
  });
  it("ignores repeated headings, dates, page numbers, signatures and blanks", () => {
    const p = parseLines(
      [
        "University of Example",
        "Row | Registration number | Assessment mark out of 100",
        "",
        "Page 1 of 2",
        "Date: 2026-09-16",
        "Signature: Examiner",
        "1 IT24100007 80",
        "Row | Registration number | Assessment mark out of 100",
        "2 IT24100008 60",
      ],
      1,
    );
    expect(p.records).toHaveLength(2);
  });
  it.each([
    "-1",
    "101",
    "100.01",
    "NaN",
    "",
    "82,75",
    "80 90",
    "82.5 footnote",
  ])("retains invalid or ambiguous mark %s for review", (mark) => {
    const { records } = parseLines([`1 IT24100007 ${mark}`], 1);
    expect(records).toHaveLength(1);
    expect(validateDraft(records[0]).errors.length).toBeGreaterThan(0);
  });
  it("retains malformed registrations instead of discarding rows", () => {
    const { records } = parseLines(["3 IT 24 100 07 50"], 1);
    expect(records).toHaveLength(1);
    expect(records[0].notes.length).toBeGreaterThan(0);
    expect(validateDraft(records[0]).errors.length).toBeGreaterThan(0);
  });
  it("flags duplicate registrations across pages", () => {
    const a = parseLines(["1 IT24100007 80"], 1).records;
    const b = parseLines(["2 it 24 1000 07 80"], 2).records;
    expect(validateRecords([...a, ...b]).errors.size).toBe(2);
  });
  it("flags gaps, initial missing numbers, repeats and page numbering resets", () => {
    const r = parseLines(
      [
        "2 IT24100007 80",
        "4 IT24100008 70",
        "4 IT24100009 60",
        "1 IT24100010 50",
      ],
      1,
    ).records;
    expect(sequenceWarnings(r)).toHaveLength(4);
  });
  it("accepts continuous row numbers over page boundaries", () => {
    const r = [
      ...parseLines(["1 IT24100007 80"], 1).records,
      ...parseLines(["2 IT24100008 70"], 2).records,
    ];
    expect(sequenceWarnings(r)).toEqual([]);
  });
  it("flags OCR records and pages without candidates", () => {
    expect(
      parseLines(["1 IT24100007 80"], 1, "ocr").records[0].notes[0],
    ).toContain("OCR");
    expect(parseLines(["Just a heading"], 2).warnings).toHaveLength(1);
  });
  it("reassembles shuffled PDF items using coordinates", () => {
    const item = (str: string, x: number, y: number) => ({
      str,
      transform: [1, 0, 0, 1, x, y],
      width: 20,
      height: 10,
    });
    const lines = textItemsToLines([
      item("82.75", 300, 700),
      item("IT 24 1000 07", 60, 700),
      item("2", 10, 680),
      item("1", 10, 700),
      item("62", 300, 680),
      item("IT24100012", 60, 680),
    ]);
    expect(lines).toEqual(["1 IT 24 1000 07 82.75", "2 IT24100012 62"]);
    expect(parseLines(lines, 1).records).toHaveLength(2);
  });
  it("preserves ambiguous multiple records on the same line", () => {
    const r = parseLines(["1 IT24100007 80 2 IT24100008 60"], 1).records;
    expect(r).toHaveLength(2);
    expect(r[0].notes.join(" ")).toContain("alignment");
  });
  it("exports registration numbers as strings with provenance", () => {
    const valid = validateRecords(
      parseLines(["1 IT01000203 82.75"], 3).records,
    ).valid;
    expect(toCsv(valid)).toContain('"IT 01 0002 03","82.75","3","1"');
  });
});
