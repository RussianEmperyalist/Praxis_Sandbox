export class QuizWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            question: options.question || '',
            type: options.type || 'single',
            options: options.options || [],
            correctAnswer: options.correctAnswer,
            onAnswer: options.onAnswer || (() => {}),
            ...options
        };
        this.element = null;
        this.answered = false;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'quiz-widget';
        this.element.innerHTML = this.getHTML();
        this.bindEvents();
        return this.element;
    }

    getHTML() {
        const { question, type, options } = this.options;
        return `
            <div class="quiz-question">${question}</div>
            <div class="quiz-options">
                ${options.map((opt, i) => `
                    <label class="quiz-option ${type === 'multiple' ? 'checkbox' : 'radio'}">
                        <input type="${type === 'multiple' ? 'checkbox' : 'radio'}" name="quiz-answer" value="${i}" data-index="${i}">
                        <span class="option-text">${opt}</span>
                    </label>
                `).join('')}
            </div>
            <button class="btn btn-primary btn-submit" ${this.answered ? 'disabled' : ''}>
                ${this.answered ? 'Отвечено' : 'Проверить'}
            </button>
            <div class="quiz-feedback" hidden></div>
        `;
    }

    bindEvents() {
        const submitBtn = this.element.querySelector('.btn-submit');
        const feedback = this.element.querySelector('.quiz-feedback');
        const inputs = this.element.querySelectorAll('input[name="quiz-answer"]');

        submitBtn.addEventListener('click', () => {
            if (this.answered) return;

            let selectedValues;
            if (this.options.type === 'multiple') {
                selectedValues = Array.from(inputs)
                    .filter(i => i.checked)
                    .map(i => parseInt(i.value, 10));
            } else {
                const selected = this.element.querySelector('input[name="quiz-answer"]:checked');
                selectedValues = selected ? [parseInt(selected.value, 10)] : [];
            }

            if (selectedValues.length === 0) return;

            this.answered = true;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отвечено';

            const isCorrect = this.checkAnswer(selectedValues);
            feedback.hidden = false;
            feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            feedback.textContent = isCorrect
                ? '✓ Правильно!'
                : `✗ Неверно. Правильный ответ: ${this.getCorrectAnswerText()}`;

            this.options.onAnswer(isCorrect, selectedValues);
        });
    }

    checkAnswer(selected) {
        const correct = this.options.correctAnswer;
        if (Array.isArray(correct)) {
            return selected.length === correct.length &&
                selected.every(v => correct.includes(v)) &&
                correct.every(v => selected.includes(v));
        }
        return selected[0] === correct;
    }

    getCorrectAnswerText() {
        const correct = this.options.correctAnswer;
        const options = this.options.options;
        if (Array.isArray(correct)) {
            return correct.map(i => options[i]).join(', ');
        }
        return options[correct];
    }

    reset() {
        this.answered = false;
        const submitBtn = this.element?.querySelector('.btn-submit');
        const feedback = this.element?.querySelector('.quiz-feedback');
        const inputs = this.element?.querySelectorAll('input[name="quiz-answer"]');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Проверить';
        }
        if (feedback) {
            feedback.hidden = true;
            feedback.textContent = '';
        }
        inputs?.forEach(i => i.checked = false);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export { QuizWidget };

export class QuizSingleChoice extends QuizWidget {
    constructor(container, options) {
        super(container, { ...options, type: 'single' });
    }
}

export class QuizMultipleChoice extends QuizWidget {
    constructor(container, options) {
        super(container, { ...options, type: 'multiple' });
    }
}

export class QuizCodeOutput extends QuizWidget {
    constructor(container, options) {
        super(container, { ...options, type: 'code' });
    }

    getHTML() {
        return `
            <div class="quiz-question">${this.options.question}</div>
            <div class="quiz-code-input">
                <textarea class="code-input" placeholder="Напишите код здесь..."></textarea>
            </div>
            <button class="btn btn-primary btn-submit" ${this.answered ? 'disabled' : ''}>
                ${this.answered ? 'Отвечено' : 'Проверить'}
            </button>
            <div class="quiz-feedback" hidden></div>
        `;
    }

    bindEvents() {
        const submitBtn = this.element.querySelector('.btn-submit');
        const feedback = this.element.querySelector('.quiz-feedback');
        const textarea = this.element.querySelector('.code-input');

        submitBtn.addEventListener('click', async () => {
            if (this.answered) return;

            const code = textarea.value;
            if (!code.trim()) return;

            this.answered = true;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Проверка...';

            try {
                const result = await this.runCode(code);
                const expected = this.options.expectedOutput;
                const isCorrect = this.compareOutput(result, expected);

                feedback.hidden = false;
                feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                feedback.textContent = isCorrect
                    ? '✓ Правильно!'
                    : `✗ Неверно. Ожидалось: ${expected}, получено: ${result}`;

                submitBtn.textContent = 'Отвечено';
                this.options.onAnswer(isCorrect, code);
            } catch (error) {
                feedback.hidden = false;
                feedback.className = 'quiz-feedback error';
                feedback.textContent = `Ошибка выполнения: ${error.message}`;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Проверить';
                this.answered = false;
            }
        });
    }

    async runCode(code) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([`
                self.onmessage = function(e) {
                    try {
                        const console = {
                            log: (...args) => self.postMessage({ type: 'log', data: args.map(String).join(' ') })
                        };
                        const result = eval(e.data.code);
                        if (result instanceof Promise) {
                            result.then(r => self.postMessage({ type: 'result', data: String(r) }))
                                .catch(err => self.postMessage({ type: 'error', data: err.message }));
                        } else {
                            self.postMessage({ type: 'result', data: String(result) });
                        }
                    } catch (err) {
                        self.postMessage({ type: 'error', data: err.message });
                    }
                };
            `], { type: 'application/javascript' });

            const worker = new Worker(URL.createObjectURL(blob));
            worker.onmessage = (e) => {
                if (e.data.type === 'result') {
                    resolve(e.data.data);
                } else if (e.data.type === 'error') {
                    reject(new Error(e.data.data));
                }
            };
            worker.onerror = (err) => reject(err);
            worker.postMessage({ code });
            setTimeout(() => { worker.terminate(); reject(new Error('Timeout')); }, 5000);
        });
    }

    compareOutput(actual, expected) {
        return actual.trim() === expected.trim();
    }

    reset() {
        this.answered = false;
        const submitBtn = this.element?.querySelector('.btn-submit');
        const feedback = this.element?.querySelector('.quiz-feedback');
        const textarea = this.element?.querySelector('.code-input');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Проверить';
        }
        if (feedback) {
            feedback.hidden = true;
            feedback.textContent = '';
        }
        if (textarea) textarea.value = '';
    }
}

export default { QuizWidget, QuizSingleChoice, QuizMultipleChoice, QuizCodeOutput };