import type { StudentRecord } from "./types";
export function toCsv(records: StudentRecord[]) {
  const quote = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  return (
    "\uFEFF" +
    [
      "registration,mark,source_page,row_number",
      ...records.map((r) =>
        [r.registration, r.mark, r.page, r.rowNumber].map(quote).join(","),
      ),
    ].join("\r\n")
  );
}
export function downloadRecords(
  records: StudentRecord[],
  format: "csv" | "json",
) {
  const exported = records.map(({ registration, mark, page, rowNumber }) => ({
    registration,
    mark,
    sourcePage: page,
    rowNumber,
  }));
  const blob = new Blob(
    [format === "csv" ? toCsv(records) : JSON.stringify(exported, null, 2)],
    { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `markwise-results.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
