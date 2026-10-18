const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('native PDF resolver accepts archive PDFs and rejects traversal, remote URLs, symlink escapes, and invalid bytes', {
  skip: process.platform !== 'darwin' || !fs.existsSync('/Applications/Xcode.app/Contents/Developer')
}, () => {
  const source = fs.readFileSync('ios/TeachTodayStageProof/App/TeacherWebViewController.swift','utf8');
  function helper(name) {
    const start = source.indexOf(`    private static func ${name}(`);
    const end = source.indexOf('\n    }',start)+6;
    assert.ok(start>=0 && end>start);
    return source.slice(start,end).replace('private static func','static func');
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'teach-today-pdf-test-'));
  const script = `import Foundation
enum BackupError: Error { case invalidRequest }
struct Resolver {
${['lessonDocumentURL','isAllowedDocumentName','isAllowedDocumentFolderName'].map(helper).join('\n')}
}
let manager = FileManager.default
let root = URL(fileURLWithPath: CommandLine.arguments[1]).appendingPathComponent("Documents")
let group = root.appendingPathComponent("Lesson Plans/Group 1/Downloaded")
try manager.createDirectory(at: group, withIntermediateDirectories: true)
let valid = group.appendingPathComponent("Lesson.pdf")
try Data("%PDF-1.7 test".utf8).write(to: valid)
let resolved = try Resolver.lessonDocumentURL("Lesson Plans/Group 1/Downloaded/Lesson.pdf", documents: root)
assert(resolved == valid.resolvingSymlinksInPath().standardizedFileURL)
func rejected(_ path: String) {
    do { _ = try Resolver.lessonDocumentURL(path, documents: root); fatalError("Accepted invalid path: \\(path)") }
    catch { }
}
for path in ["Lesson Plans/../Downloaded/Lesson.pdf", "Lesson Plans/Group 1/Downloaded/../Lesson.pdf", "/Lesson Plans/Group 1/Downloaded/Lesson.pdf", "https://example.com/Lesson.pdf", "Lesson Plans/Group 1/Other/Lesson.pdf", "Lesson Plans/Group 1/Downloaded/notes.json"] { rejected(path) }
try Data("not a PDF".utf8).write(to: group.appendingPathComponent("Invalid.pdf"))
rejected("Lesson Plans/Group 1/Downloaded/Invalid.pdf")
var large = Data("%PDF-".utf8); large.append(Data(count: 15_000_000))
try large.write(to: group.appendingPathComponent("Oversized.pdf"))
rejected("Lesson Plans/Group 1/Downloaded/Oversized.pdf")
let outside = root.deletingLastPathComponent().appendingPathComponent("Outside.pdf")
try Data("%PDF-1.7 private".utf8).write(to: outside)
try manager.createSymbolicLink(at: group.appendingPathComponent("Escape.pdf"), withDestinationURL: outside)
rejected("Lesson Plans/Group 1/Downloaded/Escape.pdf")
try manager.removeItem(at: root.appendingPathComponent("Lesson Plans"))
try manager.createSymbolicLink(at: root.appendingPathComponent("Lesson Plans"), withDestinationURL: root.deletingLastPathComponent())
rejected("Lesson Plans/Group 1/Downloaded/Lesson.pdf")
print("Native PDF boundary verified")
`;
  try {
    const filename = path.join(directory,'check.swift');
    fs.writeFileSync(filename,script);
    const result = spawnSync('/usr/bin/xcrun',['swift','-module-cache-path',path.join(directory,'module-cache'),filename,directory], {
      env:{...process.env,DEVELOPER_DIR:'/Applications/Xcode.app/Contents/Developer'},encoding:'utf8',timeout:60000
    });
    assert.equal(result.status,0,result.stderr || String(result.error));
    assert.match(result.stdout,/Native PDF boundary verified/);
  } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});

const vm = require('node:vm');
test('Preview never opens an app chooser; Open in shares explicitly; updated Stage opens Quick Look', async()=>{
  const source=fs.readFileSync('teach-today.js','utf8');
  const body=source.slice(source.indexOf('async function ttOpenExportOnDevice'),source.indexOf('function ttNativeDocumentAvailable'));
  let available=false,shares=0,previews=0,saves=0;const messages=[];
  const overlay={_exportBytes:new Uint8Array([1]),_exportFilename:'Lesson.pdf',_deviceGroupFolder:'Group 1',
    _deviceArchive:{groupFolder:'Group 1',files:[{fileName:'Lesson.pdf',local:{status:'saved',path:'Lesson Plans/Group 1/Downloaded/Lesson.pdf'}}]}};
  const context=vm.createContext({Uint8Array,File:class {},ttById:()=>overlay,ttNativePdfViewerAvailable:()=>available,
    navigator:{canShare:()=>true,share:async()=>{shares++;}},ttIsNativeIpadShell:()=>true,
    ttShowBackupToast:message=>messages.push(message),ttSaveLessonBundleArchive:async()=>{saves++;},
    ttRequestNativePdfViewer:async(paths,action)=>{assert.deepEqual(Array.from(paths),['Lesson Plans/Group 1/Downloaded/Lesson.pdf']);assert.equal(action,'preview');previews++;}
  });
  vm.runInContext(body,context);
  await context.ttOpenExportOnDevice('preview');assert.equal(shares,0);assert.equal(previews,0);assert.equal(saves,0);
  assert.match(messages[0],/PDF is open here/);
  await context.ttOpenExportOnDevice('share');assert.equal(shares,1);
  available=true;await context.ttOpenExportOnDevice('preview');assert.equal(previews,1);assert.equal(shares,1);assert.equal(saves,0);
});
