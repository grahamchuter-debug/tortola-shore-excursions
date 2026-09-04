import fs from 'fs';
import path from 'path';

const root = process.cwd();
const hard = [
  'Magens',
  'Coki Beach',
  'Paradise Point',
  'Fort Christian',
  '99 Steps',
  'Charlotte Amalie',
  "Drake's Seat",
  'US territory',
];
const soft = [
  'Cozumel',
  'Costa Maya',
  'Aruba',
  'Grand Cayman',
  'St Maarten',
  'Roatan',
  'Roatán',
  'Puerto Plata',
  'Ocho Rios',
  'Puerto Limon',
  'Puerto Limón',
  'St Kitts',
  'Bonaire',
  'Dominica',
  'Norway',
  'Bergen',
  'fjord',
  'Geiranger',
  'Sapphire',
  'Lindquist',
  'Buck Island',
];
const hits = [];

function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_quarantine-st-thomas', 'ship-schedule', 'data', 'docs'].includes(ent.name)) continue;
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(html|js|css|md)$/.test(ent.name)) {
      const t = fs.readFileSync(p, 'utf8');
      for (const n of [...hard, ...soft]) {
        if (t.includes(n)) hits.push({ file: path.relative(root, p), needle: n, hard: hard.includes(n) });
      }
    }
  }
}
walk(root);
const hardHits = hits.filter((h) => h.hard);
console.log(JSON.stringify({ total: hits.length, hard: hardHits.length, hits: hits.slice(0, 100) }, null, 2));
process.exit(hardHits.length ? 1 : 0);
