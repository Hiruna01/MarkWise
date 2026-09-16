"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  UploadCloud,
  ShieldCheck,
  ScanLine,
  ListChecks,
  ChartNoAxesCombined,
  LockKeyhole,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
export function Upload({
  onFile,
  onDemo,
  ocr,
  setOcr,
  error,
}: {
  onFile: (f: File) => void;
  onDemo: () => void;
  ocr: boolean;
  setOcr: (v: boolean) => void;
  error: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  function drop(e: React.DragEvent) {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }
  return (
    <div className="animate-enter">
      <div className="mb-9 mt-3 max-w-2xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
          <span className="h-px w-6 bg-primary" /> LESS SPREADSHEET. MORE
          PERSPECTIVE.
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">
          Every result tells a story.
          <br />
          <span className="text-muted-foreground">See the whole class.</span>
        </h1>
        <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
          Turn examination PDFs into clear, actionable insights. Review your
          results, understand performance, and find any student in seconds.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
        <section className="card p-5 sm:p-8" aria-labelledby="upload-title">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="upload-title" className="text-lg font-semibold">
              Start with your results
            </h2>
            <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              PDF ONLY
            </span>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
            >
              <AlertCircle className="size-5 shrink-0" />
              <div>
                <strong>We couldn’t read that document</strong>
                <p className="mt-1 leading-6">{error}</p>
                <button
                  className="mt-2 font-semibold underline"
                  onClick={() => input.current?.click()}
                >
                  Choose another PDF
                </button>
              </div>
            </div>
          )}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              depth.current++;
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              depth.current--;
              if (depth.current === 0) setDragging(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={drop}
            className={`flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-9 text-center transition-colors ${dragging ? "border-primary bg-primary/10" : "border-input bg-background/60"}`}
          >
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
              <UploadCloud className="size-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold">
              {dragging
                ? "Drop your PDF here"
                : "Drop your examination PDF here"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              or choose a file from your device
            </p>
            <Button
              onClick={() => input.current?.click()}
              className="mt-5 px-6"
            >
              <FileText />
              Choose PDF
              <ArrowRight className="ml-3" />
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Digital or scanned PDFs · Up to 50 MB · 300 pages
            </p>
            <input
              ref={input}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              aria-label="Upload examination PDF"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <label htmlFor="ocr" className="flex items-center gap-2 text-sm">
              <ScanLine className="size-4 text-muted-foreground" />
              Use OCR for scanned pages
            </label>
            <Switch id="ocr" checked={ocr} onCheckedChange={setOcr} />
          </div>
          <div className="mt-6 flex gap-2.5 border-t pt-5 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p>
              Your document is processed locally in your browser and is not
              permanently uploaded or stored.
            </p>
          </div>
        </section>
        <aside className="flex flex-col gap-5">
          <section className="card p-7">
            <div className="eyebrow mb-6">FROM PDF TO PERSPECTIVE</div>
            <div className="space-y-7">
              {[
                {
                  icon: ScanLine,
                  title: "Extract every page",
                  text: "Digital text or scanned tables, brought together in one place.",
                },
                {
                  icon: ListChecks,
                  title: "Review with confidence",
                  text: "Check flagged rows and make corrections before you analyze.",
                },
                {
                  icon: ChartNoAxesCombined,
                  title: "Understand the results",
                  text: "Class trends, individual performance, and exports ready to use.",
                },
              ].map((item, i) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <item.icon className="size-5" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      <span className="mr-2 text-muted-foreground">
                        0{i + 1}
                      </span>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-primary/15 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Your data stays yours.
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No accounts. No cloud uploads. Refresh or clear the workspace to
              remove your data.
            </p>
          </section>
        </aside>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <span>Want to take a look first?</span>
        <button
          onClick={onDemo}
          className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
        >
          Explore a sample dataset
          <ArrowRight className="size-4" />
        </button>
        <span className="text-xs">72 fictional student records</span>
      </div>
    </div>
  );
}
