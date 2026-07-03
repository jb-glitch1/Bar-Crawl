// Test runner: syntax-compiles every game script, then runs all *.test.js.
// Usage: node tests/run.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const base = path.join(__dirname, '..');
let fails = 0;

// 1) every js file must parse
console.log('### syntax');
function walk(dir) {
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : (f.endsWith('.js') ? [p] : []);
  });
}
let parsed = 0;
for (const f of walk(path.join(base, 'js'))) {
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); parsed++; }
  catch (e) { fails++; console.log('  SYNTAX FAIL ' + path.relative(base, f) + ': ' + e.message); }
}
console.log('  ok   ' + parsed + ' files parse');

// 2) suites
for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort()) {
  console.log('\n### ' + f);
  try { fails += require(path.join(__dirname, f))(); }
  catch (e) { fails++; console.log('  CRASH: ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n  ') : e)); }
}

console.log(fails ? '\nRESULT: FAIL (' + fails + ')' : '\nRESULT: PASS');
process.exit(fails ? 1 : 0);
