import type { ExtractionResult, Progress } from "./types";
import { parseLines, textItemsToLines, type PositionedText } from "./parser";
export class DocumentError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}
export async function extractPdf(
  file: File,
  options: {
    ocr: boolean;
    signal: AbortSignal;
    onProgress: (p: Progress) => void;
  },
): Promise<ExtractionResult> {
  const { signal, onProgress } = options;
  const check = () => {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  };
  if (file.size > 50 * 1024 * 1024)
    throw new DocumentError(
      "size",
      "This PDF exceeds the 50 MB limit. Split it into smaller documents and try again.",
    );
  if (!file.size)
    throw new DocumentError(
      "invalid",
      "This file is empty. Choose a valid PDF.",
    );
  onProgress({
    stage: "Reading PDF",
    percent: 2,
    detail: "Opening your document locally",
  });
  const bytes = new Uint8Array(await file.arrayBuffer());
  check();
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw new DocumentError(
      "invalid",
      "This file is not a valid PDF. Export the original document as a PDF and try again.",
    );
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({
    data: bytes,
    cMapUrl: "/vendor/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/standard_fonts/",
    wasmUrl: "/vendor/wasm/",
  });
  let ocrWorker: import("tesseract.js").Worker | undefined;
  const abort = () => {
    void task.destroy();
    if (ocrWorker) void ocrWorker.terminate();
  };
  signal.addEventListener("abort", abort, { once: true });
  let currentPage = 1;
  let totalPages = 1;
  try {
    const pdf = await task.promise;
    totalPages = pdf.numPages;
    if (totalPages > 300)
      throw new DocumentError(
        "size",
        "This PDF has more than 300 pages. Split the document to keep browser processing responsive.",
      );
    const result: ExtractionResult = {
      records: [],
      warnings: [],
      pages: [],
      totalPages,
    };
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      check();
      currentPage = pageNumber;
      onProgress({
        stage: "Detecting tables",
        percent: 5 + ((pageNumber - 1) / totalPages) * 85,
        detail: `Page ${pageNumber} of ${totalPages}`,
      });
      let page: Awaited<ReturnType<typeof pdf.getPage>>;
      try {
        page = await pdf.getPage(pageNumber);
      } catch {
        check();
        result.warnings.push({
          id: `page-unreadable-${pageNumber}`,
          page: pageNumber,
          message:
            "This page is unreadable. Inspect the original PDF and add any missing records manually.",
        });
        result.pages.push({ page: pageNumber, text: "", method: "text" });
        continue;
      }
      let text = "";
      let method: "text" | "ocr" = "text";
      try {
        const content = await page.getTextContent();
        text = textItemsToLines(
          content.items.filter(
            (item): item is typeof item & PositionedText => "str" in item,
          ),
        ).join("\n");
        let parsed = parseLines(text.split("\n"), pageNumber);
        if (!parsed.records.length) {
          if (!options.ocr)
            result.warnings.push({
              id: `ocr-disabled-${pageNumber}`,
              page: pageNumber,
              message:
                "No usable student table found. OCR was disabled; enable OCR and retry if this page contains scanned results.",
            });
          else {
            onProgress({
              stage: "Recognizing scanned page",
              percent: 5 + ((pageNumber - 1) / totalPages) * 85,
              detail: `Local OCR · page ${pageNumber} of ${totalPages}`,
            });
            if (!ocrWorker) {
              const { createWorker, OEM } = await import("tesseract.js");
              ocrWorker = await createWorker("eng", OEM.LSTM_ONLY, {
                workerPath: "/vendor/ocr-worker.min.js",
                corePath: "/vendor/tesseract-core",
                langPath: "/vendor",
                cacheMethod: "none",
                workerBlobURL: false,
                logger: (m) => {
                  if (!signal.aborted && m.status === "recognizing text")
                    onProgress({
                      stage: "Recognizing scanned page",
                      percent:
                        5 + ((currentPage - 1 + m.progress) / totalPages) * 85,
                      detail: `Local OCR · page ${currentPage} of ${totalPages} · ${Math.round(m.progress * 100)}%`,
                    });
                },
              });
            }
            check();
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(
              2.5,
              Math.sqrt(12_000_000 / (base.width * base.height)),
            );
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            try {
              await page.render({ canvas, viewport }).promise;
              check();
              const recognized = await ocrWorker.recognize(canvas);
              check();
              method = "ocr";
              const ocrText = recognized.data.text;
              parsed = parseLines(ocrText.split("\n"), pageNumber, "ocr");
              text =
                ocrText +
                (text ? "\n\n[Original selectable text]\n" + text : "");
              result.warnings.push({
                id: `ocr-${pageNumber}`,
                page: pageNumber,
                message: `OCR used on this page (${Math.round(recognized.data.confidence)}% engine confidence). Verify every recognized row against your PDF.`,
              });
            } finally {
              canvas.width = 0;
              canvas.height = 0;
            }
          }
        }
        result.records.push(...parsed.records);
        result.warnings.push(...parsed.warnings);
      } catch (error) {
        check();
        result.warnings.push({
          id: `page-failed-${pageNumber}`,
          page: pageNumber,
          message: `This page could not be fully processed. Review the original PDF and manually add its rows. ${error instanceof Error ? error.message.slice(0, 180) : ""}`,
        });
      } finally {
        result.pages.push({ page: pageNumber, text, method });
        page.cleanup();
      }
    }
    check();
    onProgress({
      stage: "Validating records",
      percent: 95,
      detail: `Checking ${result.records.length} candidate records across ${totalPages} pages`,
    });
    return result;
  } catch (error) {
    check();
    if (error instanceof DocumentError) throw error;
    if (error instanceof Error && error.name === "PasswordException")
      throw new DocumentError(
        "password",
        "This PDF is password-protected. Open it with your password, save an unlocked copy, and upload that copy.",
      );
    if (error instanceof Error && error.name === "InvalidPDFException")
      throw new DocumentError(
        "invalid",
        "The PDF is damaged or invalid. Export a fresh PDF from the source document and try again.",
      );
    throw new DocumentError(
      "unexpected",
      "The document could not be processed. Try a smaller PDF or a fresh export, then select it again.",
    );
  } finally {
    signal.removeEventListener("abort", abort);
    await task.destroy().catch(() => {});
    if (ocrWorker) await ocrWorker.terminate().catch(() => {});
  }
}
