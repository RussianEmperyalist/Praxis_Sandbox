const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
data.steps.forEach(s => {
  if (s.tutorial_guidance) {
    const text = s.tutorial_guidance.replace(/```[\s\S]*?```/g, '').replace(/[*_`#>~\-\[\]()]/g, ' ').replace(/\s+/g, ' ');
    const wc = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    console.log(s.step_id, ':', wc, 'words', wc >= 300 && wc <= 500 ? 'OK' : 'FAIL');
  }
});
const ind = { quiz: 0, table: 0, matching: 0, programming: 0, sql: 0 };
data.steps.forEach(s => { if (s.phase === 'independent') ind[s.task_type] = (ind[s.task_type] || 0) + 1; });
console.log('Independent:', ind);
console.log('quiz+table+matching:', ind.quiz + ind.table + ind.matching);
console.log('programming+sql:', ind.programming + ind.sql);