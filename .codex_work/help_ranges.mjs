import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const input=await FileBlob.load('/Users/macg/Downloads/Sofia Charting Excel.xlsx');
const workbook=await SpreadsheetFile.importXlsx(input);
for (const topic of ['range values','worksheet ranges','cell formatting','exportXlsx','rename worksheet']) {
 console.log('---',topic,'---');
 try {
   const h=workbook.help(topic);
   console.log(typeof h==='string'?h:JSON.stringify(h,null,2).slice(0,4000));
 } catch(e) { console.log(String(e.stack||e)); }
}
