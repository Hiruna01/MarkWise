"use client";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Moon,
  Sun,
  ShieldCheck,
  Check,
  ArrowRight,
} from "lucide-react";
import type {
  ExtractionResult,
  Progress,
  StudentRecord,
  QualityWarning,
} from "@/lib/types";
import { Upload } from "./upload";
import { Processing } from "./processing";
import { Review } from "./review";
import { Dashboard } from "./dashboard";
import { Button } from "./ui/button";
import { demoResults } from "@/lib/demo";
type View = "upload" | "processing" | "review" | "dashboard";
export function Workspace() {
  const [view, setView] = useState<View>("upload");
  const [dark, setDark] = useState(false);
  const [ocr, setOcr] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [warnings, setWarnings] = useState<QualityWarning[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    stage: "Reading PDF",
    percent: 0,
    detail: "Opening your document",
  });
  const abort = useRef<AbortController | null>(null);
  const currentFile = useRef<File | null>(null);
  const reviewVersion = useRef(0);
  const runVersion = useRef(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);
    return () => {
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  function reset() {
    runVersion.current++;
    abort.current?.abort();
    abort.current = null;
    currentFile.current = null;
    setResult(null);
    setRecords([]);
    setWarnings([]);
    setFilename("");
    setError(null);
    setIsDemo(false);
    setView("upload");
    reviewVersion.current++;
    window.scrollTo(0, 0);
  }
  async function process(file: File, forceOcr = ocr) {
    runVersion.current++;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    currentFile.current = file;
    setError(null);
    setResult(null);
    setRecords([]);
    setWarnings([]);
    setIsDemo(false);
    setFilename(file.name);
    setProgress({
      stage: "Reading PDF",
      percent: 0,
      detail: "Opening your document locally",
    });
    setView("processing");
    try {
      const { extractPdf } = await import("@/lib/pdf");
      const extracted = await extractPdf(file, {
        ocr: forceOcr,
        signal: controller.signal,
        onProgress: (p) => {
          if (!controller.signal.aborted) setProgress(p);
        },
      });
      if (controller.signal.aborted) return;
      setResult(extracted);
      reviewVersion.current++;
      setView("review");
      window.scrollTo(0, 0);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(
        e instanceof Error
          ? e.message
          : "Unexpected processing error. Select your PDF to try again.",
      );
      setView("upload");
    }
  }
  function confirm(valid: StudentRecord[], notes: QualityWarning[]) {
    const version = runVersion.current;
    setRecords(valid);
    setWarnings(notes);
    setProgress({
      stage: "Calculating statistics",
      percent: 99,
      detail: `Preparing insights for ${valid.length} students`,
    });
    setView("processing");
    window.setTimeout(() => {
      if (version !== runVersion.current) return;
      setView("dashboard");
      window.scrollTo(0, 0);
    }, 150);
  }
  function revisit() {
    if (result) {
      setResult({
        ...result,
        records: records.map((r) => ({
          ...r,
          mark: String(r.mark),
          raw:
            result.records.find((x) => x.id === r.id)?.raw ??
            "Manually reviewed",
          method: "manual",
          notes: [],
        })),
        warnings,
      });
      reviewVersion.current++;
      setView("review");
      window.scrollTo(0, 0);
    }
  }
  const currentStep =
    view === "upload"
      ? 0
      : view === "review"
        ? 1
        : view === "dashboard"
          ? 2
          : progress.stage === "Calculating statistics"
            ? 2
            : 0;
  return (
    <>
      <a
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only"
        href="#main"
      >
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-[76px] max-w-[1360px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a
            href="#main"
            className="flex items-center gap-2.5"
            aria-label="Markwise workspace"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-[-.035em]">
              markwise<span className="text-primary">.</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm md:flex">
            <span className="font-semibold">Results workspace</span>
            {view === "dashboard" && (
              <>
                <a
                  href="#student-search"
                  className="text-muted-foreground hover:text-primary"
                >
                  Student insights
                </a>
                <a
                  href="#students"
                  className="text-muted-foreground hover:text-primary"
                >
                  All results
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Private by design
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <nav
          aria-label="Processing steps"
          className="flex items-center gap-3 py-6 text-xs sm:gap-5 sm:py-7"
        >
          {["Upload document", "Review records", "Explore insights"].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-3 sm:gap-5">
                <span
                  aria-current={currentStep === i ? "step" : undefined}
                  className={`flex items-center gap-2 ${currentStep === i ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${currentStep === i ? "bg-primary text-primary-foreground" : currentStep > i ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border bg-card"}`}
                  >
                    {currentStep > i ? (
                      <Check className="size-3" />
                    ) : (
                      `0${i + 1}`
                    )}
                  </span>
                  <span>{step}</span>
                </span>
                {i < 2 && (
                  <ArrowRight className="hidden size-3 text-muted-foreground/50 min-[400px]:block" />
                )}
              </div>
            ),
          )}
        </nav>
        <main id="main" className="pb-14" tabIndex={-1}>
          {view === "upload" && (
            <Upload
              onFile={(f) => void process(f)}
              ocr={ocr}
              setOcr={setOcr}
              error={error}
              onDemo={() => {
                abort.current = null;
                currentFile.current = null;
                setResult(demoResults());
                setFilename("Introduction to Computing · Sample results");
                setIsDemo(true);
                setError(null);
                reviewVersion.current++;
                setView("review");
              }}
            />
          )}
          {view === "processing" && (
            <Processing
              progress={progress}
              filename={filename}
              onCancel={reset}
            />
          )}{" "}
          {view === "review" && result && (
            <Review
              key={reviewVersion.current}
              result={result}
              filename={filename}
              onConfirm={confirm}
              onReset={reset}
              onRetry={() => {
                if (currentFile.current) {
                  setOcr(true);
                  void process(currentFile.current, true);
                } else reset();
              }}
            />
          )}
          {view === "dashboard" && result && (
            <Dashboard
              records={records}
              filename={filename}
              totalPages={result.totalPages}
              warnings={warnings}
              isDemo={isDemo}
              onReset={reset}
              onReview={revisit}
            />
          )}
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-6 text-xs text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">markwise.</strong>
            <span className="ml-3">A clearer view of every result.</span>
          </span>
          <span>Local processing. Thoughtful analysis.</span>
        </footer>
      </div>
    </>
  );
}
