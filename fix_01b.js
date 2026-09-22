const fs = require('fs');
const data = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
const step3 = data.steps.find(s => s.step_id === 'step-3');
step3.tutorial_guidance = "Строки в Python создаются несколькими способами. Можно использовать одинарные кавычки, двойные кавычки или тройные кавычки для многострочных строк. Конкатенация — это соединение строк с помощью оператора +. Оператор * повторяет строку заданное количество раз. Метод join() объединяет список строк в одну строку через разделитель. Эти операции — основа работы с текстом в Python.\n\n```python\ns1 = 'hello'\ns2 = \"world\"\nprint(s1 + \" \" + s2)\n```\n\n```python\ns = \"abc\"\nprint(s * 3)\nprint(\"-\".join([\"2024\", \"01\", \"15\"]))\n```\n\nОбрати внимание: конкатенация работает только между строками. Попытка сложить строку и число вызовет ошибку TypeError. Для преобразования используй str(). Это частая ловушка для начинающих.\n\nТеперь о частых ошибках. Первая — забывают преобразовать число в строку перед конкатенацией. Правильно: используй str() или f-строку. Почему: Python не умеет автоматически складывать числа и строки, в отличие от некоторых других языков. `print(\"Age: \" + 25)` вызовет TypeError. Всегда приводи типы к единому виду.\n\nВторая ошибка — путают оператор + для конкатенации с оператором * для повторения. Правильно: + соединяет, * повторяет. Почему: `\"ab\" + \"cd\"` даёт `\"abcd\"`, а `\"ab\" * 3` даёт `\"ababab\"`. Это разные операции с разным результатом, не путай их. Третья ошибка — используют + для объединения списков вместо + для строк. Списки тоже поддерживают +, но результат — список, а не строка. `['a'] + ['b']` даёт `['a', 'b']`, а не `'ab'`.";
fs.writeFileSync('labs_protocols/python_core/01_numbers_strings.json', JSON.stringify(data, null, 2), 'utf-8');
const data2 = JSON.parse(fs.readFileSync('labs_protocols/python_core/01_numbers_strings.json', 'utf-8'));
data2.steps.forEach(s => {
  if (s.tutorial_guidance) {
    const text = s.tutorial_guidance.replace(/```[\s\S]*?```/g, '').replace(/[*_`#>~\-\[\]()]/g, ' ').replace(/\s+/g, ' ');
    const wc = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    console.log(s.step_id, ':', wc, 'words');
  }
});