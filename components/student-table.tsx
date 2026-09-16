"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  ArrowUpRight,
} from "lucide-react";
import type { ClassStatistics, StudentRecord } from "@/lib/types";
import { BAND_LABELS, bandIndex, studentStatistics } from "@/lib/statistics";
import { registrationKey } from "@/lib/normalization";
import { downloadRecords } from "@/lib/export";
import { fmt } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
type SortKey = "registration" | "mark" | "rank" | "percentile";
export function StudentTable({
  records,
  stats,
  passMark,
  selected,
  onSelect,
}: {
  records: StudentRecord[];
  stats: ClassStatistics;
  passMark: number;
  selected: StudentRecord | null;
  onSelect: (s: StudentRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("rank");
  const [direction, setDirection] = useState(1);
  const [page, setPage] = useState(1);
  const enriched = useMemo(
    () =>
      records.map((r) => ({
        record: r,
        s: studentStatistics(r, stats, passMark),
      })),
    [records, stats, passMark],
  );
  const filtered = useMemo(
    () =>
      enriched
        .filter(
          ({ record: r, s }) =>
            registrationKey(r.registration).includes(registrationKey(query)) &&
            (band === "all" || bandIndex(r.mark) === Number(band)) &&
            (status === "all" ||
              (status === "absent"
                ? !s
                : status === "pass"
                  ? s?.passed
                  : s && !s.passed)),
        )
        .sort((a, b) => {
          if (sort === "registration")
            return (
              direction *
              a.record.registration.localeCompare(b.record.registration)
            );
          if (sort === "mark")
            return direction * (a.record.mark - b.record.mark);
          const av = a.s?.[sort],
            bv = b.s?.[sort];
          if (av == null) return bv == null ? 0 : 1;
          if (bv == null) return -1;
          return (
            direction * (av - bv) ||
            a.record.registration.localeCompare(b.record.registration)
          );
        }),
    [enriched, query, band, status, sort, direction],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 10, current * 10);
  function changeSort(key: SortKey) {
    setDirection(
      sort === key
        ? -direction
        : key === "mark" || key === "percentile"
          ? -1
          : 1,
    );
    setSort(key);
    setPage(1);
  }
  return (
    <section id="students" className="card scroll-mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            All student results{" "}
            <span className="ml-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {records.length}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore, compare, and take your results with you.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadRecords(
                filtered.map((r) => r.record),
                "csv",
              )
            }
          >
            <Download />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadRecords(
                filtered.map((r) => r.record),
                "json",
              )
            }
          >
            <Download />
            JSON
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-y bg-background/40 px-6 py-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-9"
            aria-label="Filter student table"
            placeholder="Search registration number…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter by mark band"
          value={band}
          onChange={(e) => {
            setBand(e.target.value);
            setPage(1);
          }}
          className="select"
        >
          <option value="all">All mark bands</option>
          {BAND_LABELS.map((b, i) => (
            <option key={b} value={i}>
              {b}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by result"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="select"
        >
          <option value="all">All results</option>
          <option value="pass">Passed</option>
          <option value="fail">Failed</option>
          <option value="absent">Absent</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="w-full">
          <thead className="bg-background/50">
            <tr>
              {[
                { key: "rank", label: "Rank" },
                { key: "registration", label: "Registration number" },
                { key: "mark", label: "Mark / 100" },
                { key: "percentile", label: "Percentile" },
              ].map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort === c.key
                      ? direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() => changeSort(c.key as SortKey)}
                    className="flex items-center gap-2 text-xs uppercase tracking-wide"
                  >
                    {c.label}
                    <ArrowDownUp
                      className={`size-3 ${sort === c.key ? "text-primary" : ""}`}
                    />
                  </button>
                </th>
              ))}
              <th>Result</th>
              <th>Source</th>
              <th>
                <span className="sr-only">View student</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ record: r, s }) => (
              <tr
                key={r.id}
                className={
                  selected?.id === r.id ? "bg-primary/10" : "hover:bg-muted/40"
                }
              >
                <td className="font-semibold">
                  {s ? `#${s.rank}` : "—"}
                  {s && s.tied > 1 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      tied
                    </span>
                  )}
                </td>
                <td className="font-mono font-medium">
                  <button
                    className="hover:text-primary hover:underline"
                    onClick={() => onSelect(r)}
                  >
                    {r.registration}
                  </button>
                </td>
                <td>
                  <span className="font-semibold tabular-nums">
                    {fmt(r.mark, 2)}
                  </span>
                  <span className="ml-3 inline-block h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary/60"
                      style={{ width: `${r.mark}%` }}
                    />
                  </span>
                </td>
                <td className="tabular-nums text-muted-foreground">
                  {s ? `${fmt(s.percentile)}%` : "—"}
                </td>
                <td>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${!s ? "bg-muted text-muted-foreground" : s.passed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}
                  >
                    {s ? (s.passed ? "Passed" : "Failed") : "Absent"}
                  </span>
                </td>
                <td className="text-muted-foreground">Page {r.page}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`View ${r.registration}`}
                    onClick={() => onSelect(r)}
                  >
                    <ArrowUpRight />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No students match these filters.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setBand("all");
                setStatus("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
        <span className="text-xs text-muted-foreground">
          {filtered.length
            ? `${(current - 1) * 10 + 1}–${Math.min(current * 10, filtered.length)}`
            : "0"}{" "}
          of {filtered.length} students · Exports respect filters
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            aria-label="Previous table page"
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {current} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
            aria-label="Next table page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
