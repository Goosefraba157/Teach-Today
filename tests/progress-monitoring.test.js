const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "ProgressMonitoring.html"), "utf8");
const source = fs.readFileSync(path.join(root, "progress-monitoring.js"), "utf8");
const home = fs.readFileSync(path.join(root, "TeachToday.html"), "utf8");
const app = fs.readFileSync(path.join(root, "teach-today.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(home, /id="ttProgressMonitoring"/);
assert.match(home, /id="ttHomeProgressMonitoring"/);
assert.match(app, /function ttOpenProgressMonitoring/);
assert.match(app, /ProgressMonitoring\.html\?schoolYear=/);
assert.match(html, /Decoding · Charting/);
assert.match(html, /Encoding · Real Words/);
assert.match(html, /Set EdPlan order/);
assert.match(source, /2026-08-11[\s\S]*2026-10-09/);
assert.match(source, /2026-10-12[\s\S]*2026-12-18/);
assert.match(source, /2027-01-06[\s\S]*2027-03-05/);
assert.match(source, /2027-03-08[\s\S]*2027-05-26/);
assert.match(source, /data-copy-percent/);
assert.match(source, /navigator\.clipboard\.writeText\(value\)/);
assert.match(source, /record\.categories\?\.\["5 real words"\]/);
assert.match(source, /pmRecordYear\(record, group\) !== pmYear/);
assert.doesNotMatch(source, /localStorage\.setItem\(pmStorageKey/);
assert.match(worker, /ProgressMonitoring\.html/);
assert.match(worker, /progress-monitoring\.js/);

console.log("Progress monitoring checks passed.");
