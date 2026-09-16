"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ResetDialog } from "./ui/alert-dialog";
import { validateRecords } from "@/lib/validation";
import { normalizeRegistration } from "@/lib/normalization";
import { sequenceWarnings } from "@/lib/parser";
import type {
  DraftRecord,
  ExtractionResult,
  StudentRecord,
  QualityWarning,
} from "@/lib/types";
export function Review({
  result,
  filename,
  onConfirm,
  onReset,
  onRetry,
}: {
  result: ExtractionResult;
  filename: string;
  onConfirm: (r: StudentRecord[], warnings: QualityWarning[]) => void;
  onReset: () => void;
  onRetry: () => void;
}) {
  const [rows, setRows] = useState(result.records);
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [deleted, setDeleted] = useState<DraftRecord[]>([]);
  const [edits, setEdits] = useState(0);
  const validation = useMemo(() => validateRecords(rows), [rows]);
  const sequence = useMemo(() => sequenceWarnings(rows), [rows]);
  const warnings = [...result.warnings, ...sequence];
  const issueCount = rows.filter(
    (r) => validation.errors.has(r.id) || r.notes.length,
  ).length;
  const filtered = showIssues
    ? rows.filter((r) => validation.errors.has(r.id) || r.notes.length)
    : rows;
  const maxPage = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, maxPage);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  function edit(id: string, field: "registration" | "mark", value: string) {
    if (rows.find((r) => r.id === id)?.[field] === value) return;
    setRows((old) =>
      old.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
    setChecked(false);
    setEdits((n) => n + 1);
  }
  function remove(row: DraftRecord) {
    setDeleted((d) => [...d, row]);
    setRows((old) => old.filter((r) => r.id !== row.id));
    setChecked(false);
  }
  function confirm() {
    onConfirm(validation.valid, [
      ...warnings,
      ...(deleted.length
        ? [
            {
              id: "deleted",
              message: `${deleted.length} candidate row(s) were manually removed during review.`,
            },
          ]
        : []),
      ...(edits
        ? [
            {
              id: "edited",
              message: "Extracted values were manually edited during review.",
            },
          ]
        : []),
      ...rows
        .filter((r) => r.notes.length)
        .map((r) => ({
          id: `reviewed-${r.id}`,
          page: r.page,
          message: `${r.registration}: ${r.notes.join(" ")} Reviewed and accepted by the user.`,
        })),
    ]);
  }
  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">STEP 02 / REVIEW & REFINE</div>
          <h1 className="text-3xl font-semibold tracking-tight">
            A quick check before the big picture.
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            <span className="max-w-72 truncate">{filename}</span> ·{" "}
            {result.totalPages} pages
          </p>
        </div>
        <ResetDialog onConfirm={onReset} />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Candidate records", value: rows.length },
          { label: "Rows to check", value: issueCount },
          { label: "Blocking errors", value: validation.errors.size },
        ].map((m) => (
          <div key={m.label} className="card px-6 py-5">
            <div className="text-sm text-muted-foreground">{m.label}</div>
            <div className="metric mt-2 text-3xl font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
      {!rows.length && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <h2 className="font-semibold">No student rows detected</h2>
          <p className="mt-2 text-sm leading-6">
            Inspect the source text below. You can add records manually, retry
            with OCR enabled, or choose a different PDF.
          </p>
          <Button variant="outline" onClick={onRetry} className="mt-3">
            Retry with OCR
          </Button>
        </div>
      )}
      {warnings.length > 0 && (
        <details className="card mb-5 p-5" open>
          <summary className="cursor-pointer text-sm font-semibold">
            <AlertTriangle className="mr-2 inline size-4 text-amber-600" />
            {warnings.length} document warnings · verify completeness
          </summary>
          <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm leading-6 text-muted-foreground">
            {warnings.map((w) => (
              <li key={w.id}>
                {w.page && <strong>Page {w.page}: </strong>}
                {w.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-semibold">Review extracted records</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit cells directly. Duplicate registrations must be resolved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showIssues}
                onChange={(e) => {
                  setShowIssues(e.target.checked);
                  setPage(1);
                }}
              />
              Flagged only
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows((r) => [
                  ...r,
                  {
                    id: crypto.randomUUID(),
                    registration: "",
                    mark: "",
                    rowNumber: null,
                    page: 1,
                    raw: "Manually added",
                    method: "manual",
                    notes: [],
                  },
                ]);
                setShowIssues(false);
                setPage(Math.ceil((rows.length + 1) / 20));
                setChecked(false);
              }}
            >
              <Plus />
              Add row
            </Button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th>Row / page</th>
                <th>Registration number</th>
                <th>Mark / 100</th>
                <th>Review notes & source</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className={validation.errors.has(r.id) ? "bg-red-500/5" : ""}
                >
                  <td className="min-w-28 text-muted-foreground">
                    <span>{r.rowNumber ?? "—"}</span>
                    <div className="mt-1 text-xs">Page {r.page}</div>
                    {r.method === "manual" && (
                      <Input
                        aria-label="Source page"
                        type="number"
                        min={1}
                        max={result.totalPages}
                        value={r.page}
                        className="mt-1 h-8 w-20"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (
                            Number.isInteger(value) &&
                            value >= 1 &&
                            value <= result.totalPages
                          ) {
                            setRows((old) =>
                              old.map((x) =>
                                x.id === r.id ? { ...x, page: value } : x,
                              ),
                            );
                            setChecked(false);
                          }
                        }}
                      />
                    )}
                  </td>
                  <td>
                    <Input
                      className="min-w-44 font-mono"
                      aria-label={`Registration for row ${r.rowNumber ?? r.id}`}
                      value={r.registration}
                      onChange={(e) =>
                        edit(r.id, "registration", e.target.value)
                      }
                      onBlur={() =>
                        edit(
                          r.id,
                          "registration",
                          normalizeRegistration(r.registration),
                        )
                      }
                      aria-invalid={validation.errors.has(r.id)}
                    />
                  </td>
                  <td>
                    <Input
                      className="w-24"
                      inputMode="decimal"
                      aria-label={`Mark for ${r.registration || "new student"}`}
                      value={r.mark}
                      onChange={(e) => edit(r.id, "mark", e.target.value)}
                      aria-invalid={validation.errors.has(r.id)}
                    />
                  </td>
                  <td className="min-w-64 max-w-md">
                    {validation.errors.get(r.id)?.map((e) => (
                      <p
                        key={e}
                        className="mb-1 text-xs font-medium text-red-700 dark:text-red-300"
                      >
                        {e}
                      </p>
                    ))}
                    {r.notes.map((n) => (
                      <p
                        key={n}
                        className="text-xs leading-5 text-amber-700 dark:text-amber-300"
                      >
                        {n}
                      </p>
                    ))}
                    <details className="mt-1 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">
                        Source · {r.method}
                      </summary>
                      <p className="mt-2 break-words font-mono leading-5">
                        {r.raw}
                      </p>
                    </details>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(r)}
                      aria-label={`Delete ${r.registration || "empty row"}`}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {showIssues
                ? "No flagged records."
                : "Add a row to start your review."}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {filtered.length} records · Page {currentPage} of {maxPage}
          </span>
          <div className="flex items-center gap-2">
            {deleted.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRows((r) => [...r, ...deleted]);
                  setDeleted([]);
                  setChecked(false);
                }}
              >
                Restore {deleted.length} deleted
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous review page"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === maxPage}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next review page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </section>
      <details className="card mt-5 p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          Inspect all source text · {result.pages.length} pages
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Compare with the original PDF to catch rows the parser could not
          identify. All extracted page text is retained here.
        </p>
        {result.pages.map((p) => (
          <details key={p.page} className="mt-4 rounded-lg border p-3">
            <summary className="cursor-pointer text-sm">
              Page {p.page} · {p.method === "ocr" ? "OCR" : "Selectable text"}
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-6">
              {p.text ||
                "No text recovered. Review this page in the original PDF."}
            </pre>
          </details>
        ))}
      </details>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-primary/15 bg-primary/5 p-5">
        <label className="flex max-w-2xl items-start gap-3 text-sm leading-6">
          <input
            className="mt-1.5 accent-[var(--primary)]"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            I have checked the extracted records against the PDF, including any
            warnings and missing rows.
          </span>
        </label>
        <Button
          disabled={!checked || validation.errors.size > 0 || !rows.length}
          onClick={confirm}
        >
          <CheckCircle2 />
          Confirm & analyze
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
