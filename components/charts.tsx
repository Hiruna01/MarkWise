"use client";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";
import type { ClassStatistics, StudentRecord } from "@/lib/types";
import { bandIndex } from "@/lib/statistics";
import { fmt } from "@/lib/utils";
export function Distribution({
  stats,
  student,
}: {
  stats: ClassStatistics;
  student: StudentRecord | null;
}) {
  return (
    <section className="card p-5 sm:p-6" id="distribution">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Mark distribution</h2>
        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {stats.count} students
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        A closer look at how the class performed
      </p>
      <div
        className="mt-7 h-60 w-full"
        role="img"
        aria-label={`Mark distribution: ${stats.bands.map((b) => `${b.label}: ${b.count} students`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats.bands}
            margin={{ top: 5, right: 4, left: -22, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 4"
              vertical={false}
              stroke="var(--chart-grid)"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(v) => [`${v} students`, "Count"]}
            />
            <Bar
              dataKey="count"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            >
              {stats.bands.map((b, i) => (
                <Cell
                  key={b.label}
                  fill={
                    student && bandIndex(student.mark) === i
                      ? "#15a68a"
                      : i < 1
                        ? "#b7c2ec"
                        : "#6577db"
                  }
                />
              ))}
            </Bar>
            {student && (
              <ReferenceLine
                x={stats.bands[bandIndex(student.mark)]?.label}
                stroke="#0b9c80"
                strokeDasharray="4 4"
                label={{
                  value: "Selected",
                  fill: "var(--foreground)",
                  fontSize: 11,
                  position: "insideTop",
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span>Assessment mark / 100</span>
        <span>Decimals use intervals: 40–49 means 40 ≤ mark &lt; 50</span>
      </div>
    </section>
  );
}
export function PassChart({
  stats,
  passMark,
}: {
  stats: ClassStatistics;
  passMark: number;
}) {
  return (
    <section className="card flex flex-col p-6">
      <h2 className="text-lg font-semibold">Pass & fail</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pass mark: {passMark} / 100
      </p>
      <div
        className="relative mx-auto mt-3 h-52 w-full max-w-64"
        role="img"
        aria-label={`${stats.passCount} passed, ${stats.failCount} failed`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                stats.count
                  ? [
                      { name: "Pass", value: stats.passCount },
                      { name: "Fail", value: stats.failCount },
                    ]
                  : [{ name: "No included students", value: 1 }]
              }
              dataKey="value"
              innerRadius={70}
              outerRadius={88}
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              strokeWidth={4}
              isAnimationActive={false}
            >
              <Cell fill={stats.count ? "#36a591" : "#d3dae5"} />
              <Cell fill="#d8deeb" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="metric text-3xl font-semibold">
            {stats.count ? `${fmt(stats.passRate)}%` : "—"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">pass rate</span>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-4 border-t pt-4">
        {[
          {
            label: "Passed",
            count: stats.passCount,
            rate: stats.passRate,
            color: "bg-emerald-500",
          },
          {
            label: "Failed",
            count: stats.failCount,
            rate: stats.failRate,
            color: "bg-slate-300",
          },
        ].map((x) => (
          <div key={x.label}>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${x.color}`} />
              {x.label}
            </span>
            <span className="mt-2 inline-block text-xl font-semibold">
              {x.count}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {fmt(x.rate)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export function QuartileChart({
  stats,
  student,
}: {
  stats: ClassStatistics;
  student: StudentRecord | null;
}) {
  const ticks = [
    { label: "Minimum", value: stats.min },
    { label: "Q1", value: stats.q1 },
    { label: "Median", value: stats.median },
    { label: "Q3", value: stats.q3 },
    { label: "Maximum", value: stats.max },
  ];
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">The spread of the class</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The middle 50% sits between {fmt(stats.q1)} and {fmt(stats.q3)}.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Interquartile range{" "}
          <strong className="ml-2 text-foreground">{fmt(stats.iqr)}</strong>
        </span>
      </div>
      {stats.count > 0 ? (
        <>
          <div
            className="relative mx-3 mb-6 mt-10 h-14"
            role="img"
            aria-label={ticks
              .map((t) => `${t.label} ${fmt(t.value)}`)
              .join(", ")}
          >
            <div className="absolute left-0 right-0 top-5 h-px bg-border" />
            <div
              className="absolute top-5 h-px bg-primary"
              style={{ left: `${stats.min}%`, width: `${stats.range}%` }}
            />
            {[stats.min, stats.max].map((x, i) => (
              <div
                key={i}
                className="absolute top-2.5 h-5 w-0.5 bg-primary"
                style={{ left: `${x}%` }}
              />
            ))}
            <div
              className="absolute top-0 h-10 rounded-md border border-primary/40 bg-primary/15"
              style={{
                left: `${stats.q1}%`,
                width: `${Math.max(0.4, stats.iqr!)}%`,
              }}
            />
            <div
              className="absolute top-0 h-10 w-0.5 bg-primary"
              style={{ left: `${stats.median}%` }}
            />
            {student && (
              <div
                className="absolute -top-3 h-16 border-l-2 border-dashed border-emerald-600"
                style={{ left: `${student.mark}%` }}
                title={`Selected student: ${student.mark}`}
              >
                <span className="absolute -left-1.5 -top-1 size-2.5 rotate-45 bg-emerald-600" />
              </div>
            )}
            {[0, 20, 40, 60, 80, 100].map((x) => (
              <span
                key={x}
                className="absolute top-12 -translate-x-1/2 text-xs text-muted-foreground"
                style={{ left: `${x}%` }}
              >
                {x}
              </span>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-5 border-t pt-4">
            {ticks.map((t) => (
              <div key={t.label} className="text-center">
                <div className="text-xs text-muted-foreground">{t.label}</div>
                <div className="mt-1 text-base font-semibold">
                  {fmt(t.value)}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Include zero marks to see the class spread.
        </p>
      )}
    </section>
  );
}
