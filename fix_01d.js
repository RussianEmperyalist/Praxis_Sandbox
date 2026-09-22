const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
const step10 = data.steps.find(s => s.step_id === 'step-10');
step10.hint_levels = ["Подставь a=10, b=3 в каждый оператор", "a + b = 13, a - b = 7, a * b = 30", "a / b = 3.33, a // b = 3, a % b = 1"];
fs.writeFileSync('labs_protocols/python_core/01_numbers_strings.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
data2.steps.forEach(s => {
  if (s.hint_levels) {
    const ok = Array.isArray(s.hint_levels) && s.hint_levels.length === 3;
    if (!ok) console.log(s.step_id, ': INVALID hint_levels');
  }
});
console.log('Hint check done');