import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = process.cwd();
const imgDir = path.join(root, 'images');

function md5(f) {
  return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
}

const active = new Set();
function scan(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    if (['_quarantine-st-thomas', 'node_modules', '.git'].includes(ent.name)) continue;
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) scan(p);
    else if (/\.(html|css)$/.test(ent.name)) {
      const t = fs.readFileSync(p, 'utf8');
      for (const m of t.matchAll(/images\/([a-zA-Z0-9._-]+)/g)) active.add(m[1]);
    }
  }
}
scan(root);

const hashes = {};
const missing = [];
for (const name of [...active]) {
  const f = path.join(imgDir, name);
  if (!fs.existsSync(f)) {
    missing.push(name);
    continue;
  }
  hashes[name] = md5(f);
}

const quarantine = path.join(imgDir, '_quarantine-st-thomas');
const qHashes = {};
if (fs.existsSync(quarantine)) {
  for (const n of fs.readdirSync(quarantine)) {
    qHashes[n] = md5(path.join(quarantine, n));
  }
}

const reuse = [];
for (const [n, h] of Object.entries(hashes)) {
  for (const [qn, qh] of Object.entries(qHashes)) {
    if (h === qh) reuse.push({ active: n, quarantine: qn });
  }
}

console.log(JSON.stringify({ activeCount: active.size, missing, quarantineReuse: reuse, active: [...active].sort() }, null, 2));
process.exit(reuse.length || missing.length ? 1 : 0);
