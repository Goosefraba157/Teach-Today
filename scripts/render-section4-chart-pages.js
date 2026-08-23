#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "reader-chart-index.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "reader-chart-index.js" });

const pagesByReader = new Map();
for (const [substep, levels] of Object.entries(context.window.readerChartIndex || {})) {
  const reader = Number(substep.split(".")[0]);
  if (!Number.isInteger(reader) || reader < 1 || reader > 12) continue;
  if (!pagesByReader.has(reader)) pagesByReader.set(reader, new Set());
  for (const pages of Object.values(levels || {})) {
    for (const page of Object.keys(pages || {})) {
      const number = Number(page);
      if (Number.isInteger(number) && number > 0) pagesByReader.get(reader).add(number);
    }
  }
}

const outputDir = path.join(root, "Reader Pages for Charting Section 4", "rendered-pages");
const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "teach-today-chart-pages-"));
fs.mkdirSync(outputDir, { recursive: true });

let rendered = 0;
try {
  for (const reader of [...pagesByReader.keys()].sort((a, b) => a - b)) {
    const pdf = path.join(root, "Readers in PDF form", `WRS_Student_Reader_${reader}.pdf`);
    for (const chartPage of [...pagesByReader.get(reader)].sort((a, b) => a - b)) {
      const name = `reader${reader}-page-${String(chartPage).padStart(3, "0")}`;
      const pngBase = path.join(temporaryDir, name);
      const png = `${pngBase}.png`;
      const webp = path.join(outputDir, `${name}.webp`);
      const pdfPage = chartPage + 2;

      execFileSync("pdftoppm", [
        "-f", String(pdfPage),
        "-l", String(pdfPage),
        "-singlefile",
        "-png",
        "-r", "150",
        pdf,
        pngBase
      ], { stdio: "ignore" });
      execFileSync("cwebp", ["-quiet", "-lossless", "-z", "8", png, "-o", webp]);
      fs.unlinkSync(png);
      rendered += 1;
    }
  }
} finally {
  fs.rmSync(temporaryDir, { recursive: true, force: true });
}

console.log(`Rendered ${rendered} Section 4 Reader pages to ${outputDir}`);
