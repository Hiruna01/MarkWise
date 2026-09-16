# Markwise

A private examination-results workspace built with Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn-style Radix UI primitives, Recharts, PDF.js, Tesseract.js, Zod, and Vitest.

## Run locally

Use Node.js 22.13+ (Node 22 LTS recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. A clearly labeled fictional sample dataset is available from the upload screen. No environment variables, database, account, or external API is required.

```sh
npm test
npm run typecheck
npm run build
npm start
```

The production build uses Next.js's supported Webpack builder. `postinstall` and `build` copy the PDF worker, character maps, fonts, WebAssembly, OCR worker, and English language data into `public/vendor`. Keep `package-lock.json` committed; generated vendor assets are ignored by Git and recreated during installation/build.

## Deploy to Vercel

1. Push this project to your Git provider and import it into Vercel.
2. Choose the **Next.js** framework preset and Node.js **22.x** (or a supported newer LTS).
3. Use `npm ci` as the install command and `npm run build` as the build command. Leave the output directory at its Next.js default.
4. Deploy. No environment variables or storage services are needed.

Alternatively, from an authenticated Vercel CLI, run `vercel` for a preview and `vercel --prod` for production. The repository has no hardcoded deployment identifiers. A successful local production build does not itself constitute a live Vercel deployment.

## Workflow

Upload a digital or scanned PDF → follow per-page extraction progress → review/correct/delete/add records → acknowledge the review → explore the dashboard. All invalid and duplicate rows must be resolved before confirmation. Source text for every page is available during review; all source page numbers remain attached to records. Deletion can be undone during the current review session.

Dashboard features include all class summary metrics, mark-band counts and percentages, distribution and quartile charts, pass/fail results, highest/lowest students, autocomplete search, competition ranks, midrank percentiles, a sortable/filterable/paginated table, and CSV/JSON exports. The top export includes all confirmed records; table exports include all matching filtered records across pages, including absent students when their filter matches.

Review confirmation is essential: PDF reading order and OCR can be ambiguous. A clean validation result verifies field formats, not the source document's completeness or accuracy. Compare against the original PDF. Complex multi-column tables, handwriting, non-English scanned content, merged cells, and heavily degraded scans may need manual correction.

## Privacy and processing limits

- PDF bytes and extracted results remain in browser memory. No upload endpoint, server action, database, analytics, remote font, or third-party document processing is present.
- OCR assets are served from this app's own origin; Tesseract language caching is disabled. Documents/marks are never put in localStorage, sessionStorage, IndexedDB, cookies, URL parameters, or application logs.
- Only static application assets are requested. The content security policy restricts connections to the same origin.
- Refreshing or choosing “Process another document” clears document state. Downloaded exports are user-owned files and remain on the user's device. Browser memory is garbage-collected; JavaScript cannot promise forensic secure erasure.
- Limits: 50 MB and 300 PDF pages. OCR runs sequentially with a bounded render canvas (12 megapixels maximum). OCR is enabled by default and can be turned off before upload. Pages with no candidate student table use the OCR fallback, including scanned tables with selectable headers.
- Password-protected PDFs must be unlocked by the user before upload. Cancel terminates the processing workers. Page failures are retained as warnings so partial results can be reviewed.
- Modern browsers with Web Workers, WebAssembly, and modern PDF.js platform support are required. Initial OCR loads a larger local language/engine asset bundle and may take longer on low-power devices.

## Calculation conventions

- Performance statistics use all validated records unless zero marks are treated as absent. Absent students remain in exports and the student table, but have no performance rank, percentile, quartile, z-score, or pass/fail result.
- Population standard deviation divides by N. Quartiles use inclusive R-7 linear interpolation at `(N - 1) * p`.
- Mode contains all values sharing the highest frequency; distinct values occurring once produce no mode.
- Pass is `mark >= passMark` (default 40). Mark bands have lower-inclusive and upper-exclusive boundaries: the label 40–49 means `[40, 50)`. The last interval is `[90, 100]`.
- Competition rank is `1 + count(higher marks)`, yielding 1, 2, 2, 4 for ties.
- Midrank percentile is `(count(lower) + 0.5 * count(equal)) / N * 100`. Equal includes the selected student. It is a tie-adjusted position, not literally the proportion with marks at or below the student.
- Top X% membership uses `rank <= ceil(N * X / 100)`; ties can expand groups. Quartile membership follows Q1/median/Q3 mark boundaries, assigning a boundary to the higher quartile.
- A zero standard deviation produces an undefined z-score displayed as an em dash. An empty included population produces no mean, quartiles, or extrema. Display rounding never affects calculations.

## Structure

- `lib/pdf.ts`: browser-only PDF/OCR orchestration, progress, cancellation, and error handling.
- `lib/parser.ts`: coordinate-based line reconstruction, row parsing, suspicious rows, sequential numbering checks.
- `lib/normalization.ts`, `lib/validation.ts`: registration handling and Zod validation.
- `lib/statistics.ts`: pure calculations with precomputed mark positions for efficient student lookup.
- `lib/export.ts`: local CSV/JSON export.
- `components/`: separate upload, processing, review, dashboard, chart, search, and table views; accessible UI primitives in `components/ui/`.
- `tests/`: Vitest coverage for calculations, boundaries, malformed input, duplicates, row ordering, normalization, and CSV provenance.
- `tests/fixtures/`: synthetic digital, scanned, password-protected (`test-password`), and invalid PDFs for manual browser verification. These contain no actual student data. `scripts/create-test-pdfs.py` regenerates them with Python reportlab, Pillow, and pypdf; it is not needed to run or deploy the application.

## Browser verification checklist

Use the included fixtures to check digital extraction (six rows over two pages), OCR (three scanned rows), password recovery, and invalid-file recovery. With the sample dataset, check review edits/deletion/restoration, duplicate blocking, pass-mark updates, absent handling, all three registration search formats, keyboard suggestions, sorting, filters, pagination, CSV/JSON downloads, light/dark themes, narrow-screen overflow, and refresh/reset clearing. Real-world PDFs should always be reviewed against their original pages.
