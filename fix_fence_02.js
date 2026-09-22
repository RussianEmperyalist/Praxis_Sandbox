const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
const step3 = data.steps.find(s => s.step_id === 'step-3');
// Ensure 2 fence blocks
const fences = (step3.tutorial_guidance.match(/```[\s\S]*?```/g) || []);
console.log('Fences:', fences.length);
// If only 1, add a second code example
if (fences.length < 2) {
  step3.tutorial_guidance += "\n\nПример среза с шагом:\n\n```python\nnums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\nprint(nums[::3])   # [0, 3, 6, 9]\nprint(nums[1::3])  # [1, 4, 7]\nprint(nums[::-2])  # [9, 7, 5, 3, 1]\n```";
}
fs.writeFileSync('labs_protocols/python_core/02_lists.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
const s3 = data2.steps.find(s => s.step_id === 'step-3');
console.log('After fix:', (s3.tutorial_guidance.match(/```[\s\S]*?```/g) || []).length, 'fences');