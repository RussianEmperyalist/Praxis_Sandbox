const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
const step3 = data.steps.find(s => s.step_id === 'step-3');
step3.tutorial_guidance += " Создание строк — первое, что ты освоишь в Python. Одинарные кавычки '...', двойные кавычки \"...\" и тройные кавычки '''...''' или \"\"\"...\"\"\" — все создают строки. Разницы между одинарными и двойными нет, выбор — вопрос стиля. Тройные кавычки нужны для многострочных строк.\n\nКонкатенация через + — простой и понятный способ соединить строки. Но помни: + работает только между строками. Если тебе нужно соединить число со строкой, сначала преобразуй число через str(). Это экономит время на отладке.\n\nОператор * для строк — удобный способ повторить текст. 'x' * 10 создаст строку из десяти иксиков. Это полезно для создания разделителей и визуального оформления вывода.\n\nМетод join() — более элегантный способ объединить список строк. Вместо множественных + ты пишешь разделитель.join(список). Это быстрее, читабельнее и идиоматичнее для Python. Разделитель может быть любой строкой: пробел, запятая, дефис, перенос строки.";
fs.writeFileSync('labs_protocols/python_core/01_numbers_strings.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
data2.steps.forEach(s => {
  if (s.tutorial_guidance) {
    const text = s.tutorial_guidance.replace(/```[\s\S]*?```/g, '').replace(/[*_`#>~\-\[\]()]/g, ' ').replace(/\s+/g, ' ');
    const wc = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    console.log(s.step_id, ':', wc, 'words');
  }
});