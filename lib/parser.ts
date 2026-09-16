import { normalizeRegistration } from "./normalization";
import type { DraftRecord, QualityWarning } from "./types";
export interface PositionedText {
  str: string;
  transform: number[];
  width: number;
  height: number;
}
export function textItemsToLines(items: PositionedText[]): string[] {
  const lines: { y: number; height: number; items: PositionedText[] }[] = [];
  for (const item of [...items]
    .filter((i) => i.str.trim())
    .sort(
      (a, b) =>
        b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
    )) {
    const y = item.transform[5];
    const tolerance = Math.max(2, Math.min(Math.abs(item.height) * 0.35, 5));
    let line = lines.find((l) => Math.abs(l.y - y) <= tolerance);
    if (!line) {
      line = { y, height: item.height, items: [] };
      lines.push(line);
    }
    line.items.push(item);
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) =>
      line.items
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
}
const registrationPattern = /\bI[Tt][\s-]*\d{2}[\s-]*\d{4}[\s-]*\d{2}(?!\d)/gi;
const headingPattern =
  /registration|assessment|student\s*(id|number)|signature|prepared by|approved by|page\s*\d|\bdate\b|examination|faculty|university|department|marks?\s*(out of|\/|\()/i;
export function parseLines(
  lines: string[],
  page: number,
  method: "text" | "ocr" = "text",
): { records: DraftRecord[]; warnings: QualityWarning[] } {
  const records: DraftRecord[] = [];
  const warnings: QualityWarning[] = [];
  for (const [index, original] of lines.entries()) {
    const line = original.trim();
    if (!line) continue;
    const matches = [...line.matchAll(registrationPattern)];
    if (!matches.length) {
      const looksLikeRow =
        /\bI[T17][\s-]*\d/i.test(line) ||
        /^\d+\s*[|\s]\s*\S+\s+[\d.]+\s*$/.test(line);
      if (looksLikeRow && !headingPattern.test(line)) {
        records.push({
          id: `p${page}-l${index}`,
          registration: line.match(/\bI\S*(?:\s+\d+){0,3}/i)?.[0] ?? "",
          mark: "",
          rowNumber: Number(line.match(/^\d+/)?.[0]) || null,
          page,
          raw: line,
          method,
          notes: [
            "Uncertain row: registration or mark could not be recognized.",
          ],
        });
      }
      continue;
    }
    matches.forEach((match, matchIndex) => {
      const before = line.slice(
        matchIndex
          ? matches[matchIndex - 1].index! + matches[matchIndex - 1][0].length
          : 0,
        match.index,
      );
      const after = line
        .slice(
          match.index! + match[0].length,
          matches[matchIndex + 1]?.index ?? line.length,
        )
        .replace(/[|]/g, " ")
        .trim();
      const rowMatch = before.match(/(?:^|\s|\|)(\d+)\s*[|.)]?\s*$/);
      const markMatch = after.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*%\s*)?$/);
      const notes: string[] = [];
      if (!markMatch)
        notes.push("Mark is missing or ambiguous. Check the source line.");
      if (method === "ocr")
        notes.push("Recognized with OCR. Verify against the original PDF.");
      if (matches.length > 1)
        notes.push(
          "Multiple registrations on one source line. Check column alignment.",
        );
      records.push({
        id: `p${page}-l${index}-${matchIndex}`,
        registration: normalizeRegistration(match[0]),
        mark: markMatch?.[1] ?? "",
        rowNumber: rowMatch ? Number(rowMatch[1]) : null,
        page,
        raw: line,
        method,
        notes,
      });
    });
  }
  if (!records.length)
    warnings.push({
      id: `empty-${page}`,
      page,
      message:
        "No student rows recognized on this page. Inspect its source text and add any missing records.",
    });
  return { records, warnings };
}
export function sequenceWarnings(records: DraftRecord[]): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  let previous: number | null = null;
  for (const record of records) {
    if (record.rowNumber === null) continue;
    if (previous === null && record.rowNumber !== 1)
      warnings.push({
        id: `seq-${record.id}`,
        page: record.page,
        message: `Numbered rows begin at ${record.rowNumber}; earlier records may be missing.`,
      });
    if (previous !== null && record.rowNumber !== previous + 1)
      warnings.push({
        id: `seq-${record.id}`,
        page: record.page,
        message: `Row sequence jumps from ${previous} to ${record.rowNumber}. Check for missing rows or numbering restarted on a new page.`,
      });
    previous = record.rowNumber;
  }
  if (records.length && records.every((r) => r.rowNumber === null))
    warnings.push({
      id: "no-sequence",
      message:
        "No row numbers were detected; completeness cannot be checked automatically.",
    });
  return warnings;
}
