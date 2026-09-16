import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const root = (name) => path.dirname(require.resolve(`${name}/package.json`));
await mkdir("public/vendor", { recursive: true });
await cp(
  path.join(root("pdfjs-dist"), "build/pdf.worker.min.mjs"),
  "public/vendor/pdf.worker.min.mjs",
);
for (const dir of ["cmaps", "standard_fonts", "wasm"])
  await cp(path.join(root("pdfjs-dist"), dir), `public/vendor/${dir}`, {
    recursive: true,
  });
await cp(
  path.join(root("tesseract.js"), "dist/worker.min.js"),
  "public/vendor/ocr-worker.min.js",
);
await cp(root("tesseract.js-core"), "public/vendor/tesseract-core", {
  recursive: true,
});
await cp(
  path.join(
    root("@tesseract.js-data/eng"),
    "4.0.0_best_int/eng.traineddata.gz",
  ),
  "public/vendor/eng.traineddata.gz",
);
