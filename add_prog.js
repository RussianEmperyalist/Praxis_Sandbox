const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
data.steps.push({
  step_id: "step-17",
  phase: "independent",
  task_type: "programming",
  points: 10,
  markdown_text: "Напиши код, который из списка чисел [1, 2, 3, 4, 5] создаёт список их квадратов [1, 4, 9, 16, 25] через цикл.",
  hint_levels: ["Используй цикл for", "x ** 2 или x * x", "append() для добавления"],
  starter_code: "nums = [1, 2, 3, 4, 5]\nsquares = []\n",
  check_rules: ["Используется цикл", "Каждый элемент возведён в квадрат", "Результат: [1, 4, 9, 16, 25]"]
});
fs.writeFileSync('labs_protocols/python_core/01_numbers_strings.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
const ind = { quiz: 0, table: 0, matching: 0, programming: 0, sql: 0 };
data2.steps.forEach(s => { if (s.phase === 'independent') ind[s.task_type] = (ind[s.task_type] || 0) + 1; });
console.log('Independent:', ind);
console.log('quiz+table+matching:', ind.quiz + ind.table + ind.matching);
console.log('programming+sql:', ind.programming + ind.sql);