export class ConsoleOutput {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxLines: options.maxLines || 100,
            ...options
        };
        this.element = null;
        this.lines = [];
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'console-output';
        this.element.innerHTML = `
            <div class="console-header">
                <span class="console-title">Консоль</span>
                <button class="btn btn-icon btn-clear" title="Очистить">🗑</button>
            </div>
            <div class="console-body" id="console-body"></div>
            <div class="console-input-line">
                <span class="console-prompt">></span>
                <input type="text" class="console-input" placeholder="Введите команду...">
            </div>
        `;
        this.bindEvents();
        return this.element;
    }

    bindEvents() {
        const clearBtn = this.element.querySelector('.btn-clear');
        const input = this.element.querySelector('.console-input');
        const body = this.element.querySelector('#console-body');

        clearBtn.addEventListener('click', () => {
            this.clear();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    this.executeCommand(command);
                    input.value = '';
                }
            }
        });
    }

    log(...args) {
        this.addLine('log', args.map(String).join(' '));
    }

    error(...args) {
        this.addLine('error', args.map(String).join(' '));
    }

    warn(...args) {
        this.addLine('warn', args.map(String).join(' '));
    }

    addLine(type, text) {
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        line.textContent = text;
        this.element?.querySelector('#console-body')?.appendChild(line);
        this.scrollToBottom();
        this.trimLines();
    }

    clear() {
        this.element?.querySelector('#console-body')?.replaceChildren();
        this.lines = [];
    }

    scrollToBottom() {
        const body = this.element?.querySelector('#console-body');
        if (body) body.scrollTop = body.scrollHeight;
    }

    trimLines() {
        const body = this.element?.querySelector('#console-body');
        if (body && body.children.length > this.options.maxLines) {
            body.removeChild(body.firstChild);
        }
    }

    async executeCommand(command) {
        this.addLine('log', `> ${command}`);

        try {
            const result = await this.runInWorker(command);
            if (result !== undefined) {
                this.addLine('log', String(result));
            }
        } catch (error) {
            this.addLine('error', error.message);
        }
    }

    runInWorker(code) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([`
                self.onmessage = function(e) {
                    try {
                        const result = eval(e.data.code);
                        if (result instanceof Promise) {
                            result.then(r => self.postMessage({ type: 'result', data: r }))
                                .catch(err => self.postMessage({ type: 'error', data: err.message }));
                        } else {
                            self.postMessage({ type: 'result', data: result });
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

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default ConsoleOutput;