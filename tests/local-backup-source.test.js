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

test("daily backup snapshots current local state instead of reading Firebase", () => {
  const artifact = functionBody("ttLocalBackupArtifact", "ttLocalBackupSignature");
  const runBackup = functionBody("ttRunIndependentBackup", "ttRunNativeBackupNow");
  const stageBackup = functionBody("ttBackupCurrentStageState", "ttSetNativeProjectionMode");

  assert.match(artifact, /const localState = JSON\.parse\(JSON\.stringify\(appState\)\)/);
  assert.match(artifact, /type: "local-device-state"/);
  assert.match(artifact, /appState: localState/);
  assert.doesNotMatch(runBackup, /ttFirebaseReadEnvelope/);
  assert.doesNotMatch(stageBackup, /ttFirebasePayload\(/);
});

test("Google Drive backup is downloaded and hash-verified after upload", () => {
  const verify = functionBody("ttVerifyDriveBackup", "ttDriveCsv");
  const save = functionBody("ttSaveIndependentDriveBackup", "ttNativeBackupAvailable");

  assert.match(verify, /\?alt=media/);
  assert.match(verify, /ttSha256Hex/);
  assert.match(verify, /content hash differs/);
  assert.match(save, /ttVerifyDriveBackup\(dailyFile, digest, names\.daily\)/);
  assert.match(save, /ttVerifyDriveBackup\(weeklyFile, digest, names\.weekly\)/);
});
