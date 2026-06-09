import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = '/Users/macg/Documents/New project/outputs/xavier_charting';
const templatePath = '/Users/macg/Downloads/Sofia Charting Excel.xlsx';
const outputPath = path.join(outputDir, 'Xavier Charting Excel.xlsx');

function date(y, m, d) {
  return new Date(y, m - 1, d);
}

const columns = [
  {
    date: date(2025, 8, 27),
    substep: '2.5 review',
    comment: '',
    type: 'R',
    words: { 15: 'Absent', 14: 'Sick', 13: 'WJ trip' },
  },
  {
    date: date(2025, 9, 3),
    substep: '',
    comment: 'quiet / fluent',
    type: 'R',
    words: {},
  },
  {
    date: date(2025, 9, 10),
    substep: '2.5 105',
    comment: 'quiet / fluent',
    type: 'R',
    words: {},
  },
  {
    date: date(2025, 9, 16),
    substep: '2.5 109 red',
    comment: '',
    type: 'R',
    words: { 15: 'spintj [?] / un' },
  },
  {
    date: date(2025, 9, 16),
    substep: '2.5 109 red',
    comment: '',
    type: 'R',
    words: {},
  },
  {
    date: date(2025, 9, 17),
    substep: '2.5 180',
    comment: '15+',
    type: 'R',
    words: { 15: 'let / home', 14: 'early' },
  },
  {
    date: date(2025, 9, 23),
    substep: '6.1 2',
    comment: '20+',
    type: 'R',
    words: { 15: 'v-or', 14: '-ivil [?]' },
  },
  {
    date: date(2025, 10, 20),
    substep: '6.1 3',
    comment: '',
    type: 'R',
    words: {},
  },
  {
    date: date(2025, 10, 21),
    substep: '6.1 4',
    comment: '',
    type: 'R',
    words: { 15: 'Absent' },
  },
  {
    date: date(2025, 10, 27),
    substep: '6.1 5,6',
    comment: '3 chance [?]',
    type: 'R',
    words: { 15: 'visitor [?]' },
  },
  {
    date: date(2025, 10, 29),
    substep: '6.1 C',
    comment: 'fluent',
    type: 'R',
    words: { 15: 'visitor [?]' },
  },
  {
    date: date(2025, 11, 5),
    substep: '6.1 7',
    comment: '34 sec',
    type: 'R',
    words: {},
  },
  {
    date: null,
    substep: '6.2',
    comment: 'stopped / high word [?]',
    type: 'R',
    words: { 15: 'id / unpacked', 14: 'id / reviewed', 13: 'thick / dwindle [?]' },
  },
  {
    date: null,
    substep: '6.2 d',
    comment: '',
    type: 'R',
    words: {},
  },
  {
    date: null,
    substep: '6.2 t',
    comment: '',
    type: 'R',
    words: {},
  },
  {
    date: date(2026, 2, 1),
    substep: '6.4 100',
    comment: 'acc',
    type: 'R',
    words: { 15: 'probable', 14: 'reptile' },
  },
  {
    date: date(2026, 2, 18),
    substep: '6.4 109',
    comment: 'stle [?]',
    type: 'R',
    words: { 15: 'stable', 14: 'cattle' },
  },
];

const input = await FileBlob.load(templatePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem('WRS Template');

sheet.getRange('B4').values = [['Xavier J.']];

// The template has 16 formatted student-data columns. Copy an interior
// column's style across the extra columns so the added entries stay consistent.
sheet.getRange('R6:S21').copyFrom(sheet.getRange('Q6:Q21'), 'formats');

const blankHeader = Array.from({ length: 4 }, () => Array(17).fill(null));
const blankWords = Array.from({ length: 12 }, () => Array(17).fill(null));
sheet.getRange('C6:S9').values = blankHeader;
sheet.getRange('C10:S21').values = blankWords;

sheet.getRange('C6:S9').values = [
  columns.map((c) => c.date),
  columns.map((c) => c.substep),
  columns.map((c) => c.comment),
  columns.map((c) => c.type),
];

const scores = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4];
sheet.getRange('C10:S21').values = scores.map((score) =>
  columns.map((c) => c.words[score] ?? null),
);

sheet.getRange('C6:S6').format.numberFormat = 'm-d-yy';
sheet.getRange('C6:S21').format.wrapText = true;
sheet.getRange('C6:S21').format.verticalAlignment = 'center';
sheet.getRange('C6:S21').format.horizontalAlignment = 'center';

const check = await workbook.inspect({
  kind: 'table',
  range: 'WRS Template!A1:S21',
  include: 'values,formulas',
  tableMaxRows: 21,
  tableMaxCols: 19,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
});
console.log(errors.ndjson);

await workbook.render({ sheetName: 'WRS Template', range: 'A1:S21', scale: 2 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
