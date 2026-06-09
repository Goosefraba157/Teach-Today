import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const input = await FileBlob.load('/Users/macg/Downloads/Sofia Charting Excel.xlsx');
const workbook = await SpreadsheetFile.importXlsx(input);
console.log('worksheets', workbook.worksheets.items?.map(s => ({name:s.name, id:s.id})) ?? workbook.worksheets.map?.(s=>s.name));
for (const s of workbook.worksheets.items ?? []) {
  console.log('sheet', s.name, s.id);
}
const help = await workbook.help?.('inspect');
if (help) console.log(String(help).slice(0,1000));
const res = await workbook.inspect({kind:'workbook', summary:'template'}).catch(e=>({error:String(e.stack||e)}));
console.log(JSON.stringify(res, null, 2).slice(0,6000));
