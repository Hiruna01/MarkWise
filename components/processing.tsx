import { Check, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import type { Progress } from "@/lib/types";
import { Button } from "./ui/button";
const stages = [
  "Reading PDF",
  "Detecting tables",
  "Validating records",
  "Calculating statistics",
];
export function Processing({
  progress,
  filename,
  onCancel,
}: {
  progress: Progress;
  filename: string;
  onCancel: () => void;
}) {
  const stage =
    progress.stage === "Recognizing scanned page"
      ? 1
      : stages.indexOf(progress.stage);
  return (
    <section className="card mx-auto my-12 max-w-xl p-8 text-center sm:p-12">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="size-8" />
      </div>
      <h1 className="text-2xl font-semibold">Making sense of your results</h1>
      <p className="mt-2 truncate text-sm text-muted-foreground">{filename}</p>
      <div
        role="progressbar"
        aria-label="Document extraction"
        aria-valuenow={Math.round(progress.percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-8 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {progress.detail}
      </p>
      <div className="my-8 space-y-4 text-left">
        {stages.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 text-sm ${i > stage ? "text-muted-foreground" : ""}`}
          >
            {i < stage ? (
              <Check className="size-5 text-emerald-600" />
            ) : i === stage ? (
              <LoaderCircle className="size-5 animate-spin text-primary" />
            ) : (
              <span className="m-1 size-3 rounded-full border" />
            )}
            <span className={i === stage ? "font-semibold" : ""}>
              {i === 1 && progress.stage === "Recognizing scanned page"
                ? "Recognizing scanned page (local OCR)"
                : label}
            </span>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={onCancel}>
        Cancel processing
      </Button>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        Your document never leaves this browser.
      </p>
    </section>
  );
}
