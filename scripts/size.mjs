// Reports the gzip size of every JS and CSS file in dist/ and the total, so the Builder can check
// the performance budget without gzip or du: `npm run build && npm run size`.
// Fails (exit 1) if the total gzipped JS exceeds BUDGET_JS_KB (default 90).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dir = path.resolve(process.argv[2] || 'dist');
const budget = Number(process.env.BUDGET_JS_KB || 90);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(js|mjs|css)$/.test(e.name)) out.push(full);
  }
  return out;
}

if (!fs.existsSync(dir)) {
  console.error(`size: ${dir} not found, run npm run build first`);
  process.exit(1);
}

let js = 0;
let css = 0;
for (const file of walk(dir)) {
  const gz = zlib.gzipSync(fs.readFileSync(file)).length;
  if (file.endsWith('.css')) css += gz;
  else js += gz;
  console.log(`${(gz / 1024).toFixed(1).padStart(7)} KB  ${path.relative(dir, file)}`);
}
console.log(`JS total ${(js / 1024).toFixed(1)} KB gzip (budget ${budget} KB), CSS total ${(css / 1024).toFixed(1)} KB gzip`);
process.exit(js / 1024 > budget ? 1 : 0);
