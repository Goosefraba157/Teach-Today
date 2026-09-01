const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");

function functionBody(name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0 && end > start, `could not isolate ${name}`);
  return source.slice(start, end);
}

test("the native Stage shell is local-only while browsers retain protected automatic sync", () => {
  assert.match(source, /function ttStageLocalOnlyMode\(\)/);
  assert.match(source, /Stage local mode: saved on this iPad\. Automatic Firebase sync is paused\./);

  const queue = functionBody("ttQueueFirebaseSync", "ttSyncFirebaseAndLocalNow");
  assert.match(queue, /if \(ttStageLocalOnlyMode\(\)\)/);
  assert.match(queue, /ttBackupCurrentStageState\(\)/);
  assert.match(queue, /ttFirebaseTimer = setTimeout\(\(\) => ttFirebaseSyncWrite\(\), 1200\)/);

  const listener = functionBody("ttStartFirebaseRevisionListener", "ttFirebaseSignIn");
  assert.match(listener, /!ttFirebaseUser \|\| ttStageLocalOnlyMode\(\)/);
  assert.match(listener, /Another device changed Firebase\. Reconciling both copies safely/);
  assert.match(listener, /ttQueueFirebaseSync\(\)/);
  assert.match(listener, /archiveLocal: true/);

  const init = functionBody("ttInitFirebaseSync", "ttBackupData");
  assert.match(init, /if \(ttStageLocalOnlyMode\(\)\)/);
  assert.match(init, /ttBackupCurrentStageState\(\)/);
  assert.match(init, /ttFirebaseRestoreIfNewer\(\{ archiveLocal: true \}\)/);
  assert.match(init, /if \(ttHasUnsyncedFirebaseChanges\(\)\) \{\s*ttQueueFirebaseSync\(\)/);

  const write = functionBody("ttFirebaseSyncWrite", "ttSecureLegacyStudentData");
  assert.match(write, /if \(ttStageLocalOnlyMode\(\)\)/);
  assert.match(write, /ttBackupCurrentStageState\(\)/);
  const preserveLocal = write.indexOf("ttPreserveLocalRecovery");
  const archiveCloud = write.indexOf("ttArchiveFirebaseBranch");
  const reconcile = write.indexOf("mergePayloads");
  assert.ok(preserveLocal >= 0, "sync must preserve a local Recovery snapshot first");
  assert.ok(archiveCloud > preserveLocal, "sync must archive the Firebase branch after local recovery");
  assert.ok(reconcile > archiveCloud, "sync must reconcile only after preserving both copies");
});
