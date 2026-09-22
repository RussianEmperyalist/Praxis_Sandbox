const fs = require('fs');
const raw = fs.readFileSync('labs_protocols/python_core/02_lists.json', 'utf-8');
const data = JSON.parse(raw);
const s3 = data.steps.find(s => s.step_id === 'step-3');
function countFenceBlocks(text) {
    const matches = text.match(/```[\w]*\n[\s\S]*?```/g);
    return matches ? matches.length : 0;
}
console.log('Fence blocks (validator regex):', countFenceBlocks(s3.tutorial_guidance));
console.log('Has python fence:', s3.tutorial_guidance.includes('```python'));
console.log('Newlines:', (s3.tutorial_guidance.match(/\n/g) || []).length);
// Show first 200 chars
console.log('Start:', JSON.stringify(s3.tutorial_guidance.substring(0, 200)));