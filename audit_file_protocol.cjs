// Аудит: что мешает запуску приложения по протоколу file://
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else if (f.endsWith('.js')) out.push(f);
  }
  return out;
}

for (const f of walk('src')) {
  const src = fs.readFileSync(f, 'utf-8');
  const imports = (src.match(/^import\s.+$/gm) || []);
  const absPaths = src.match(/["'`]\//g) || [];
  console.log(
    f.padEnd(40),
    'lines=' + String(src.split('\n').length).padEnd(5),
    'importStmts=' + String(imports.length).padEnd(3),
    'absPaths=' + absPaths.length
  );
  imports.forEach(i => console.log('     ' + i.trim()));
  absPaths && (src.match(/["'`]\/[^"'`]*["'`]/g) || []).forEach(a => console.log('     PATH ' + a));
}
