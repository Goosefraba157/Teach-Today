import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const input = await FileBlob.load('/Users/macg/Downloads/Sofia Charting Excel.xlsx');
const workbook = await SpreadsheetFile.importXlsx(input);
for (const range of ['WRS Template!A1:Z80','WRS Template!A1:H40','WRS Template!I1:Z40']) {
  const res = await workbook.inspect({kind:'table', range, include:'values,formulas,formats', tableMaxRows:80, tableMaxCols:26});
  console.log('---RANGE', range);
  console.log(res.ndjson.slice(0,12000));
}
const errors = await workbook.inspect({kind:'match', searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options:{useRegex:true,maxResults:50}, summary:'errors'});
console.log('ERRORS', errors.ndjson);
