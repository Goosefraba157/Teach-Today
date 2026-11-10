const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('teach-today.js', 'utf8');
function extract(name, next) {
  return source.slice(source.indexOf(`async function ${name}(`), source.indexOf(`async function ${next}(`));
}
function fixture(statuses, native = true, authorized = true) {
  const calls = [], status = new Map();
  const context = vm.createContext({
    ttDriveAccessToken: 'expired',
    fetch: async (_url, options) => { calls.push(options); return { status: statuses.shift() }; },
    ttNativeDriveAvailable: () => native,
    ttEnsureDrivePermission: async () => { context.ttDriveAccessToken = authorized ? 'renewed' : ''; return authorized; },
    localStorage: { setItem: (k,v) => status.set(k,v) },
    ttRenderDataCenter() {}
  });
  vm.runInContext(extract('ttDriveFetch', 'ttDriveRequest'), context);
  return { context, calls, status };
}
test('expired token renews once and retries the same upload body with fresh authorization', async () => {
  const f = fixture([401, 200]);
  const body = { synthetic: true };
  assert.equal((await f.context.ttDriveFetch('synthetic', {method:'PATCH',body})).status, 200);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].headers.Authorization, 'Bearer expired');
  assert.equal(f.calls[1].headers.Authorization, 'Bearer renewed');
  assert.equal(f.calls[1].body, body);
});
test('repeated rejection is bounded, clears token and replaces connected status', async () => {
  const f = fixture([401,401]);
  assert.equal((await f.context.ttDriveFetch('synthetic')).status,401);
  assert.equal(f.calls.length,2);
  assert.equal(f.context.ttDriveAccessToken,'');
  assert.match(f.status.get('teachToday.driveStatus'),/needs attention/);
});
test('browser or revoked native grant requires explicit connect without looping', async () => {
  for (const native of [false,true]) {
    const f = fixture([401],native,false);
    assert.equal((await f.context.ttDriveFetch('synthetic')).status,401);
    assert.equal(f.calls.length,1);
    assert.equal(f.context.ttDriveAccessToken,'');
  }
});
test('other failures do not retry uploads', async () => {
  const f = fixture([503]);
  assert.equal((await f.context.ttDriveFetch('synthetic')).status,503);
  assert.equal(f.calls.length,1);
});
test('Records connect discards stale token before forced backup', async () => {
  const context = vm.createContext({ttDriveAccessToken:'expired',ttIndependentBackupEnabledKey:'enabled', localStorage:{setItem(){}},
    ttEnsureIndependentBackups: async (_source, options) => { assert.equal(context.ttDriveAccessToken,''); assert.equal(options.requestDrivePermission,true); }
  });
  vm.runInContext(extract('ttRunIndependentBackup','ttRunNativeBackupNow'),context);
  await context.ttRunIndependentBackup({connectDrive:true});
});
test('interactive native reconnect can recover a revoked Keychain grant in one click', async () => {
  let calls=0;
  const context=vm.createContext({ttDriveAccessToken:'',ttNativeDriveAvailable:()=>true,
    ttNativeDriveAccessToken:async options=>{assert.equal(options.interactive,true); if (++calls===1) throw new Error('Connect Google Drive backup once in Records to authorize this iPad.'); return 'new';},
    localStorage:{setItem(){}},ttRenderDataCenter(){}
  });
  vm.runInContext(extract('ttEnsureDrivePermission','ttDriveFetch'), context);
  assert.equal(await context.ttEnsureDrivePermission({interactive:true}),true);
  assert.equal(calls,2);
});
