#!/usr/bin/env node
/* Bundles src3d/stage.src.js with three.js into src/assets/js/stage.js (one minified file, no CDN).
   Needs esbuild and a three.js build. Only re-run after you change the 3D code.
     node tools/build3d.js  [path/to/three.module.js] */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const cands = [process.argv[2], path.join(ROOT, 'vendor/three.module.js'), '/home/claude/mrdoob/three.js/build/three.module.js'].filter(Boolean);
const three = cands.find((p) => fs.existsSync(p));
const esb = ['/opt/npm-tools/node_modules/esbuild/bin/esbuild', path.join(ROOT, 'node_modules/.bin/esbuild')].find((p) => fs.existsSync(p)) || 'esbuild';
if (!three) { console.error('three.module.js not found'); process.exit(1); }
const out = path.join(ROOT, 'src/assets/js/stage.js');
execFileSync(esb, [path.join(ROOT, 'src3d/stage.src.js'), '--bundle', '--minify', '--format=iife', '--target=es2018', '--legal-comments=none', `--alias:three=${three}`, `--outfile=${out}`, '--log-level=warning'], { stdio: 'inherit' });
console.log('stage.js', (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
