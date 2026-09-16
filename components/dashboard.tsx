"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  SlidersHorizontal,
  Users,
  ChartNoAxesCombined,
  Target,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import type { StudentRecord, QualityWarning } from "@/lib/types";
import { calculateStatistics } from "@/lib/statistics";
import { fmt } from "@/lib/utils";
import { downloadRecords } from "@/lib/export";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { ResetDialog } from "./ui/alert-dialog";
import { Distribution, PassChart, QuartileChart } from "./charts";
import { StudentSearch } from "./student-search";
import { StudentTable } from "./student-table";
export function Dashboard({
  records,
  filename,
  totalPages,
  warnings,
  isDemo,
  onReset,
  onReview,
}: {
  records: StudentRecord[];
  filename: string;
  totalPages: number;
  warnings: QualityWarning[];
  isDemo: boolean;
  onReset: () => void;
  onReview: () => void;
}) {
  const [passMark, setPassMark] = useState(40);
  const [passInput, setPassInput] = useState("40");
  const [excludeZeros, setExcludeZeros] = useState(false);
  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const stats = useMemo(
    () => calculateStatistics(records, passMark, excludeZeros),
    [records, passMark, excludeZeros],
  );
  const passError =
    passInput.trim() === "" ||
    !Number.isFinite(Number(passInput)) ||
    Number(passInput) < 0 ||
    Number(passInput) > 100;
  function selectFromTable(student: StudentRecord) {
    setSelected(student);
    document
      .getElementById("student-search")
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  }
  const metrics = [
    {
      label: "Students analyzed",
      value: String(stats.count),
      sub: excludeZeros
        ? `${stats.absent} absent · ${stats.total} total records`
        : `${totalPages} pages · all records included`,
      icon: Users,
    },
    {
      label: "Class average",
      value: fmt(stats.mean, 2),
      unit: "/ 100",
      sub: `Median ${fmt(stats.median)} · Population SD ${fmt(stats.stdDev, 2)}`,
      icon: ChartNoAxesCombined,
    },
    {
      label: "Pass rate",
      value: stats.count ? fmt(stats.passRate) + "%" : "—",
      sub: `${stats.passCount} passed · ${stats.failCount} failed`,
      icon: Target,
    },
    {
      label: "Highest mark",
      value: fmt(stats.max, 2),
      unit: "/ 100",
      sub: `Lowest ${fmt(stats.min)} · Range ${fmt(stats.range)}`,
      icon: TrendingUp,
    },
  ];
  return (
    <div className="animate-enter space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="eyebrow">CLASS PERFORMANCE</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mr-1.5 inline size-3" />
              Review complete
            </span>
            {isDemo && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                Sample data
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The bigger picture.
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 shrink-0" />
            <span className="max-w-[65vw] truncate sm:max-w-lg">
              {filename}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onReview}>
            Review data
          </Button>
          <Button onClick={() => downloadRecords(records, "csv")}>
            <Download />
            Export results
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <label htmlFor="pass-mark" className="text-sm font-medium">
            Pass mark
          </label>
          <Input
            id="pass-mark"
            type="number"
            min={0}
            max={100}
            step="any"
            className="h-9 w-20"
            value={passInput}
            aria-invalid={passError}
            aria-describedby={passError ? "pass-error" : undefined}
            onChange={(e) => {
              setPassInput(e.target.value);
              const n = Number(e.target.value);
              if (
                e.target.value.trim() &&
                Number.isFinite(n) &&
                n >= 0 &&
                n <= 100
              )
                setPassMark(n);
            }}
          />
          <span className="text-sm text-muted-foreground">/ 100</span>
          {passError && (
            <span id="pass-error" className="max-w-36 text-xs text-red-600">
              Enter 0–100. Currently using {passMark}.
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Switch
            id="exclude-zero"
            checked={excludeZeros}
            onCheckedChange={setExcludeZeros}
          />
          <label htmlFor="exclude-zero" className="text-sm">
            Treat zero marks as absent
          </label>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {excludeZeros
              ? `${stats.absent} absent · zeros excluded`
              : `${stats.zeros} zeros included`}
          </span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <section className="card px-5 py-5" key={m.label}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {m.label}
              </h2>
              <m.icon className="size-4 text-primary/75" />
            </div>
            <div className="metric mt-4 text-4xl font-semibold">
              {m.value}
              {m.unit && (
                <span className="ml-2 text-base font-normal tracking-normal text-muted-foreground">
                  {m.unit}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {m.sub}
            </p>
          </section>
        ))}
      </div>
      {stats.count === 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-500/5 p-5 text-sm"
        >
          All students are currently marked absent. Turn off “Treat zero marks
          as absent” to calculate class performance.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        <Distribution
          stats={stats}
          student={
            selected && stats.included.some((r) => r.id === selected.id)
              ? selected
              : null
          }
        />
        <PassChart stats={stats} passMark={passMark} />
      </div>
      <QuartileChart
        stats={stats}
        student={
          selected && stats.included.some((r) => r.id === selected.id)
            ? selected
            : null
        }
      />
      <StudentSearch
        records={records}
        stats={stats}
        passMark={passMark}
        selected={selected}
        onSelect={setSelected}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          {
            title: "Highest-performing students",
            list: stats.included.slice(0, 3),
            icon: ArrowUpRight,
            color: "text-emerald-600",
          },
          {
            title: "Lowest-performing students",
            list: [...stats.included]
              .sort(
                (a, b) =>
                  a.mark - b.mark ||
                  a.registration.localeCompare(b.registration),
              )
              .slice(0, 3),
            icon: ArrowDownRight,
            color: "text-amber-600",
          },
        ].map((section) => (
          <section key={section.title} className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <section.icon className={`size-4 ${section.color}`} />
              {section.title}
            </h2>
            {section.list.map((r) => (
              <button
                key={r.id}
                onClick={() => selectFromTable(r)}
                className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="font-mono">{r.registration}</span>
                <span className="font-semibold">
                  {fmt(r.mark, 2)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / 100
                  </span>
                </span>
              </button>
            ))}
            {!section.list.length && (
              <p className="mt-5 text-sm text-muted-foreground">
                No included students.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Up to 3 shown; equal marks ordered by registration.
            </p>
          </section>
        ))}
      </div>
      <StudentTable
        records={records}
        stats={stats}
        passMark={passMark}
        selected={selected}
        onSelect={selectFromTable}
      />
      <section className="card p-6" id="details">
        <h2 className="text-lg font-semibold">Statistics, in detail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {excludeZeros ? "Zero marks excluded." : "Zero marks included."}{" "}
          Calculations use {stats.count} students.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            { label: "Mean", value: fmt(stats.mean, 2) },
            { label: "Median", value: fmt(stats.median, 2) },
            {
              label: "Mode",
              value: stats.modes.length
                ? stats.modes.map((x) => fmt(x, 2)).join(", ")
                : "No repeated marks",
            },
            { label: "Standard deviation", value: fmt(stats.stdDev, 2) },
            { label: "First quartile (Q1)", value: fmt(stats.q1, 2) },
            { label: "Third quartile (Q3)", value: fmt(stats.q3, 2) },
            { label: "Interquartile range", value: fmt(stats.iqr, 2) },
            {
              label: excludeZeros ? "Absent / zero marks" : "Zero marks",
              value: String(stats.zeros),
            },
          ].map((x) => (
            <div key={x.label}>
              <div className="text-xs text-muted-foreground">{x.label}</div>
              <div className="mt-2 break-words text-base font-semibold">
                {x.value}
              </div>
            </div>
          ))}
        </div>
        <div className="table-wrap mt-6 rounded-lg border">
          <table className="w-full">
            <caption className="sr-only">
              Number and percentage of included students in each mark band
            </caption>
            <thead className="bg-background">
              <tr>
                <th>Mark band</th>
                {stats.bands.map((b) => (
                  <th key={b.label}>{b.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Students</td>
                {stats.bands.map((b) => (
                  <td key={b.label}>{b.count}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">Percentage</td>
                {stats.bands.map((b) => (
                  <td key={b.label}>{fmt(b.percentage)}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <details className="mt-4 text-xs leading-6 text-muted-foreground">
          <summary className="cursor-pointer">Calculation conventions</summary>
          <p className="mt-2">
            Standard deviation uses the population formula (divide by N).
            Quartiles use linear interpolation at (N − 1) × p (R-7 / inclusive
            percentiles). Mode lists every value sharing the highest frequency;
            no mode is reported when every mark occurs once. Marks equal to the
            pass mark pass. Decimal bands use lower-inclusive, upper-exclusive
            boundaries, except the final band includes 100. Display values are
            rounded; calculations use full precision.
          </p>
        </details>
      </section>
      <section className="card p-6" id="quality">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {warnings.length ? (
              <AlertTriangle className="size-5 text-amber-600" />
            ) : (
              <ShieldCheck className="size-5 text-emerald-600" />
            )}
            Data quality & extraction
          </h2>
          <Button variant="outline" size="sm" onClick={onReview}>
            Revisit review
          </Button>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {records.length} valid, unique registrations · {totalPages} source
          pages · Review confirmed.{" "}
          {warnings.length
            ? `${warnings.length} review notes retained.`
            : "No unresolved validation errors."}{" "}
          Always check completeness against the original document.
        </p>
        {warnings.length > 0 && (
          <details className="mt-4 rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              View extraction and review notes ({warnings.length})
            </summary>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-xs leading-6 text-muted-foreground">
              {warnings.map((w, i) => (
                <li key={`${w.id}-${i}`}>
                  {w.page && <strong>Page {w.page}: </strong>}
                  {w.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          Only in this browser. Nothing saved after a refresh.
        </p>
        <ResetDialog onConfirm={onReset} />
      </div>
    </div>
  );
}
