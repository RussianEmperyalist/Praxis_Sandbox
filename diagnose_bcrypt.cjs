// Диагностика загрузки bcryptjs так, как это делает src/db/auth.js
const fs = require('fs');

const code = fs.readFileSync('lib/bcryptjs.min.js', 'utf-8');
console.log('size =', code.length, 'lines =', code.split('\n').length);

// 1. Какими аргументами UMD-библиотека вызывает свою IIFE?
const tail = code.slice(-200).replace(/\n/g, '\\n');
console.log('TAIL:', tail);

// 2. Ровно та логика, что в auth.js: direct eval внутри ES-модуля (strict, this === undefined)
function emulateModuleEval(src) {
  // new Function даёт function-скоуп; чтобы получить строгий режим и this === undefined,
  // как в ES-модуле, оборачиваем в "use strict" и вызываем без контекста.
  const fn = new Function('module', '"use strict";\n' + src + '\nreturn typeof module === "object" ? module.exports : null;');
  const module = { exports: {} };
  fn.call(undefined, module);
  return module.exports;
}

try {
  const ex = emulateModuleEval(code);
  console.log('module.exports keys =', Object.keys(ex || {}));
  console.log('typeof module.exports.hash =', typeof (ex || {}).hash);
} catch (e) {
  console.log('EVAL FAILED:', e.constructor.name, '-', e.message);
}

// 3. Куда библиотека кладёт экспорт, если доходит до глобальной ветки?
try {
  const g = { globalThis: globalThis };
  const viaGlobal = new Function('"use strict";\n' + code);
  viaGlobal.call(undefined);
  console.log('global dcodeIO =', typeof globalThis.dcodeIO, 'bcrypt =', typeof (globalThis.dcodeIO || {}).bcrypt);
} catch (e) {
  console.log('GLOBAL BRANCH FAILED:', e.constructor.name, '-', e.message);
}
