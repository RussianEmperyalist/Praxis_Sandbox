export class CodeEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            language: options.language || 'javascript',
            theme: options.theme || 'dark',
            readOnly: options.readOnly || false,
            onChange: options.onChange || (() => {}),
            ...options
        };
        this.element = null;
        this.editor = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'code-editor';
        this.element.innerHTML = `
            <div class="editor-toolbar">
                <span class="editor-language">${this.options.language}</span>
                <button class="btn btn-icon btn-run" title="Выполнить">▶</button>
            </div>
            <textarea class="editor-textarea" ${this.options.readOnly ? 'readonly' : ''} spellcheck="false"></textarea>
            <div class="editor-output" hidden></div>
        `;
        this.bindEvents();
        return this.element;
    }

    bindEvents() {
        const textarea = this.element.querySelector('.editor-textarea');
        const runBtn = this.element.querySelector('.btn-run');
        const output = this.element.querySelector('.editor-output');

        textarea.addEventListener('input', () => {
            this.options.onChange(textarea.value);
        });

        runBtn.addEventListener('click', () => {
            this.executeCode(textarea.value, output);
        });
    }

    async executeCode(code, outputElement) {
        outputElement.hidden = false;
        outputElement.textContent = 'Выполнение...';

        try {
            const result = await this.runInWorker(code);
            outputElement.textContent = result;
            outputElement.className = 'editor-output success';
        } catch (error) {
            outputElement.textContent = `Ошибка: ${error.message}`;
            outputElement.className = 'editor-output error';
        }
    }

    runInWorker(code) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([`
                self.onmessage = function(e) {
                    try {
                        const console = {
                            log: (...args) => self.postMessage({ type: 'log', data: args.map(String).join(' ') }),
                            error: (...args) => self.postMessage({ type: 'error', data: args.map(String).join(' ') }),
                            warn: (...args) => self.postMessage({ type: 'warn', data: args.map(String).join(' ') })
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
                } else if (e.data.type === 'log') {
                    console.log(e.data.data);
                }
            };
            worker.onerror = (err) => reject(err);
            worker.postMessage({ code });
            setTimeout(() => { worker.terminate(); reject(new Error('Timeout')); }, 5000);
        });
    }

    getValue() {
        return this.element?.querySelector('.editor-textarea')?.value || '';
    }

    setValue(value) {
        if (this.element) {
            this.element.querySelector('.editor-textarea').value = value;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default CodeEditor;