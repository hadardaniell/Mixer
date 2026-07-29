/**
 * Verifies that every dependency a service declares resolves, from that service's own
 * directory, to the major version it asked for.
 *
 * Why this exists: the repo is a pnpm workspace with `node-linker=hoisted`, so most deps
 * live in the ROOT node_modules and only conflicting versions stay nested under
 * apps/<svc>/node_modules. A runtime image that copies the root tree but omits the app's
 * own tree still starts fine — resolution just climbs one level up and picks a different
 * major. That surfaces as a 500 on the first request, not as a startup crash, so neither
 * `docker build` nor an import-only smoke test catches it.
 *
 * Usage:  node check-app-deps.cjs /app/apps/api
 */
const fs = require('node:fs');
const path = require('node:path');

const appDir = process.argv[2] || process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));

/** Walk the node_modules chain the way Node does, returning the package dir that wins. */
function resolvePackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const problems = [];

for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
  const dir = resolvePackageDir(name, appDir);
  if (!dir) {
    problems.push(`${name}: not resolvable from ${appDir} (declared ${range})`);
    continue;
  }
  // workspace:* links have no meaningful version to compare — resolving is the whole test.
  if (range.startsWith('workspace:')) continue;

  const wanted = range.match(/(\d+)\./);
  if (!wanted) continue; // tags, urls, ranges we can't compare — skip rather than guess
  const actual = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  if (actual.split('.')[0] !== wanted[1]) {
    problems.push(`${name}: declared ${range} but resolves to ${actual} (${dir})`);
  }
}

if (problems.length > 0) {
  console.error(`✗ dependency resolution mismatch in ${appDir}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✓ ${Object.keys(pkg.dependencies ?? {}).length} deps resolve correctly from ${appDir}`);
