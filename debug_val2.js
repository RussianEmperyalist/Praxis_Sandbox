const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8'));
const s4 = data.steps.find(s => s.step_id === 'step-4');
function countFenceBlocks(text) {
    const matches = text.match(/```[\w]*\n[\s\S]*?```/g);
    return matches ? matches.length : 0;
}
console.log('step-4 fences:', countFenceBlocks(s4.tutorial_guidance));
console.log('step-4 text start:', JSON.stringify(s4.tutorial_guidance.substring(0, 100)));