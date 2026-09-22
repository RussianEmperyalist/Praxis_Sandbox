const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/03_dicts_sets_tuples.json', 'utf-8'));
function countWords(text) {
  const noFences = text.replace(/```[\s\S]*?```/g, '');
  const noMd = noFences.replace(/[*_`#>~\-\[\]()]/g, ' ').replace(/\s+/g, ' ');
  return noMd.trim().split(/\s+/).filter(Boolean).length;
}
function countFences(text) {
  return (text.match(/```[\w]*\n[\s\S]*?```/g) || []).length;
}
function countMistakes(text) {
  const patterns = [
    /Ошибка[\s\S]*?Правильно[\s\S]*?Почему[\s\S]*?(?=Ошибка|$)/gi,
    /❌[\s\S]*?✅[\s\S]*?💡/g,
    /ошибк[аи][\s\S]*?правильн[оаы][\s\S]*?пochemu/gi
  ];
  let count = 0;
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) count += matches.length;
  }
  if (count < 2) {
    const errMatches = text.match(/Ошибка[:\s]/gi);
    const corrMatches = text.match(/Правильно[:\s]/gi);
    if (errMatches && corrMatches) count = Math.min(errMatches.length, corrMatches.length);
  }
  if (count < 2) {
    const errOnly = text.match(/Ошибка[^*]*?:/gi);
    if (errOnly) count = errOnly.length;
  }
  return count;
}
data.steps.forEach((step, index) => {
  if (step.phase === 'guided') {
    console.log(step.step_id, 'words=', countWords(step.tutorial_guidance), 'fences=', countFences(step.tutorial_guidance), 'mistakes=', countMistakes(step.tutorial_guidance));
  }
});
const counts = { quiz: 0, table: 0, matching: 0, programming: 0, sql: 0 };
data.steps.forEach(step => {
  if (step.phase === 'independent') counts[step.task_type] = (counts[step.task_type] || 0) + 1;
});
console.log('independent=', counts, 'total_steps=', data.steps.length);
