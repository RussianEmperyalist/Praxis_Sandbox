const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
const s4 = data.steps.find(s => s.step_id === 'step-4');
s4.tutorial_guidance += "\n\nГлубокая копия нужна когда список содержит другие списки:\n\n```python\nimport copy\noriginal = [[1, 2], [3, 4]]\nshallow = original.copy()\ndeep = copy.deepcopy(original)\noriginal[0][0] = 99\nprint(shallow)  # [[99, 2], [3, 4]] — внутренний список изменился!\nprint(deep)     # [[1, 2], [3, 4]] — полностью независим\n```";
fs.writeFileSync('labs_protocols/python_core/02_lists.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
const s4b = data2.steps.find(s => s.step_id === 'step-4');
function countFenceBlocks(text) {
    const matches = text.match(/```[\w]*\n[\s\S]*?```/g);
    return matches ? matches.length : 0;
}
console.log('step-4 fences now:', countFenceBlocks(s4b.tutorial_guidance));
const text = s4b.tutorial_guidance.replace(/```[\s\S]*?```/g, '').replace(/[*_`#>~\-\[\]()]/g, ' ').replace(/\s+/g, ' ');
const wc = text.trim().split(/\s+/).filter(w => w.length > 0).length;
console.log('step-4 words:', wc);