#!/usr/bin/env node
/* Swap the placeholder domain for your real one, everywhere (canonical, sitemap, robots, social tags, schema).
     node tools/set-domain.js https://www.example.com          -> rewrites dist/ and src/site.js
   After that you can deploy dist/ as it is, or run `node tools/build.js` again (it keeps your domain). */
const fs = require('fs');
const path = require('path');

const arg = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(arg)) {
  console.error('Usage: node tools/set-domain.js https://your-real-domain.com   (no path, no trailing slash)');
  process.exit(1);
}
const ROOT = path.join(__dirname, '..');
// replace whatever domain is currently baked in (the placeholder the first time, your old domain later)
const OLD = (fs.readFileSync(path.join(ROOT, 'src/site.js'), 'utf8').match(/process\.env\.SITE_URL \|\| '([^']*)'/) || [])[1] || 'https://your-domain.example';
const exts = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest', '.svg', '.js']);
let files = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!exts.has(path.extname(f.name))) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes(OLD)) { fs.writeFileSync(p, s.split(OLD).join(arg)); files++; }
  }
})(path.join(ROOT, 'dist'));

// keep future builds on the new domain
const sp = path.join(ROOT, 'src/site.js');
const sj = fs.readFileSync(sp, 'utf8');
fs.writeFileSync(sp, sj.replace(/process\.env\.SITE_URL \|\| '[^']*'/, `process.env.SITE_URL || '${arg}'`));
console.log(`Updated ${files} files in dist/ and src/site.js -> ${arg}`);
