import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const input=await FileBlob.load('/Users/macg/Documents/New project/outputs/xavier_charting/Xavier Charting Excel.xlsx');
const workbook=await SpreadsheetFile.importXlsx(input);
const blob=await workbook.render({sheetName:'WRS Template', range:'A1:S21', scale:2});
await fs.writeFile('/Users/macg/Documents/New project/.codex_work/xavier_preview.png', Buffer.from(await blob.arrayBuffer()));
console.log('/Users/macg/Documents/New project/.codex_work/xavier_preview.png');
