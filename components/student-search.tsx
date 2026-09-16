"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpRight, X, UserRound, Info } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { registrationKey } from "@/lib/normalization";
import { studentStatistics } from "@/lib/statistics";
import { fmt } from "@/lib/utils";
import type { ClassStatistics, StudentRecord } from "@/lib/types";
export function StudentSearch({
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
  onSelect: (s: StudentRecord | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (selected) setQuery(selected.registration);
  }, [selected]);
  const matches = useMemo(
    () =>
      query.trim()
        ? records
            .filter((r) =>
              registrationKey(r.registration).includes(registrationKey(query)),
            )
            .slice(0, 8)
        : [],
    [query, records],
  );
  const s = selected ? studentStatistics(selected, stats, passMark) : null;
  function choose(student: StudentRecord) {
    onSelect(student);
    setQuery(student.registration);
    setOpen(false);
    setActive(-1);
  }
  return (
    <section id="student-search" className="card scroll-mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <UserRound className="size-4" />
            <span className="eyebrow text-primary">INDIVIDUAL INSIGHTS</span>
          </div>
          <h2 className="text-xl font-semibold">
            Find a student. See their standing.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search by IT registration number, with or without spaces.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
          <Input
            role="combobox"
            aria-label="Find a student by registration number"
            aria-autocomplete="list"
            aria-controls="student-suggestions"
            aria-expanded={open && query.trim().length > 0}
            aria-activedescendant={
              open && active >= 0 ? `suggestion-${active}` : undefined
            }
            placeholder="e.g. IT 24 1000 07"
            value={query}
            className="pl-10 pr-10"
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              setOpen(true);
              setActive(-1);
              const exact = records.find(
                (r) => registrationKey(r.registration) === registrationKey(v),
              );
              onSelect(exact ?? null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(a + 1, matches.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              }
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && matches.length) {
                e.preventDefault();
                choose(matches[active >= 0 ? active : 0]);
              }
            }}
          />
          {query && (
            <button
              aria-label="Clear student search"
              className="absolute right-3 top-3.5 text-muted-foreground"
              onClick={() => {
                setQuery("");
                onSelect(null);
                setOpen(false);
              }}
            >
              <X className="size-4" />
            </button>
          )}
          {open && query.trim() && (
            <ul
              id="student-suggestions"
              role="listbox"
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-card p-1 shadow-lg"
            >
              {matches.map((r, i) => (
                <li
                  role="option"
                  aria-selected={active === i}
                  id={`suggestion-${i}`}
                  key={r.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm ${active === i ? "bg-muted" : "hover:bg-muted"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                >
                  <span className="font-mono">{r.registration}</span>
                  <span className="text-muted-foreground">{r.mark}%</span>
                </li>
              ))}
              {!matches.length && (
                <li className="p-4 text-sm text-muted-foreground">
                  No matching student. Check the full registration number.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      {!selected ? (
        <div className="mt-6 rounded-xl border border-dashed p-7 text-center">
          <Search className="mx-auto size-6 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {query
              ? "No student selected. Choose a suggestion or check the registration number."
              : "Every student’s result, in context. Start with a registration number above."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-primary/5 px-5 py-5">
            <div>
              <div className="font-mono text-lg font-semibold">
                {selected.registration}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Source page {selected.page}
                {s && ` · ${s.band} mark band`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="metric text-3xl font-semibold">
                {fmt(selected.mark, 2)}
                <span className="ml-1 text-base text-muted-foreground">
                  / 100
                </span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${!s ? "bg-muted" : s.passed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}
              >
                {s ? (s.passed ? "Passed" : "Failed") : "Absent"}
              </span>
            </div>
          </div>
          {s ? (
            <>
              <div className="grid grid-cols-2 gap-y-6 p-5 sm:grid-cols-4">
                {[
                  {
                    label: "Class rank",
                    value: `#${s.rank}`,
                    sub:
                      s.tied > 1
                        ? `Tied with ${s.tied - 1} other${s.tied > 2 ? "s" : ""}`
                        : `of ${stats.count} students`,
                  },
                  {
                    label: "Percentile",
                    value: `${fmt(s.percentile)}th`,
                    sub: "Tie-aware midrank",
                  },
                  {
                    label: "Vs. class average",
                    value: `${s.difference >= 0 ? "+" : ""}${fmt(s.difference)}`,
                    sub: "percentage points",
                  },
                  {
                    label: "Z-score",
                    value: fmt(s.zScore, 2),
                    sub:
                      s.zScore === null
                        ? "No variation in class"
                        : "standard deviations",
                  },
                ].map((x) => (
                  <div key={x.label}>
                    <div className="text-xs text-muted-foreground">
                      {x.label}
                    </div>
                    <div className="metric mt-2 text-2xl font-semibold">
                      {x.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {x.sub}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-5 border-t py-4">
                <div className="mb-3 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {s.below} below · {s.above} above
                  </span>
                  <span>
                    Quartile {s.quartile} · {fmt(selected.mark, 2)}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/25"
                    style={{ width: `${s.percentile}%` }}
                  />
                  <div
                    className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-[3px] border-card bg-primary shadow-sm"
                    style={{ left: `${s.percentile}%` }}
                  />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  This student’s tie-adjusted position is approximately{" "}
                  {fmt(s.percentile)}% of the way up the class. {s.below}{" "}
                  student{s.below !== 1 ? "s have" : " has"} a lower mark, and{" "}
                  {s.tied} {s.tied === 1 ? "student has" : "students share"}{" "}
                  this mark (including this student).
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {[5, 10, 25, 50].map((p) => (
                    <span
                      key={p}
                      className={`rounded-md border px-2.5 py-1 text-xs ${s.top.includes(p) ? "border-primary/20 bg-primary/5 font-semibold text-primary" : "text-muted-foreground"}`}
                    >
                      {s.top.includes(p) && (
                        <ArrowUpRight className="mr-1 inline size-3" />
                      )}
                      Top {p}%{s.top.includes(p) ? " ✓" : ""}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="p-5 text-sm leading-6 text-muted-foreground">
              This student has a zero mark and is marked absent. Rank,
              percentile, pass/fail, and performance comparisons are excluded.
              Turn off “Treat zero marks as absent” to include this result.
            </p>
          )}
        </div>
      )}
      <details className="mt-4 text-xs leading-6 text-muted-foreground">
        <summary className="cursor-pointer">
          <Info className="mr-1.5 inline size-3.5" />
          How ranks and percentiles work
        </summary>
        <p className="mt-2">
          Rank = 1 + students with a higher mark. Ties share a rank (1, 2, 2,
          4). Percentile = (students below + half of students with an equal
          mark) ÷ included students × 100. Top-group membership uses competition
          rank ≤ the rounded-up group size, so ties can expand a group.
          Quartiles use class mark boundaries; a mark on a boundary enters the
          higher quartile. All comparisons follow the current zero-mark setting.
        </p>
      </details>
    </section>
  );
}
