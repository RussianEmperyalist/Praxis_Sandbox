import { auth } from '../db/auth.js';
import { idb } from '../db/idb.js';

export class ModuleSelector {
    constructor(onModuleSelect, onLogout) {
        this.onModuleSelect = onModuleSelect;
        this.onLogout = onLogout;
        this.element = null;
        this.user = null;
        this.modules = [
            { id: 'basics', title: 'Основы программирования', description: 'Переменные, циклы, условия', icon: '📚', lessons: 5 },
            { id: 'functions', title: 'Функции и модули', description: 'Область видимости, замыкания, модули', icon: '⚙️', lessons: 4 },
            { id: 'data-structures', title: 'Структуры данных', description: 'Массивы, объекты, Map, Set', icon: '🗂️', lessons: 6 },
            { id: 'async', title: 'Асинхронность', description: 'Promise, async/await, fetch', icon: '⚡', lessons: 5 },
            { id: 'dom', title: 'Работа с DOM', description: 'События, манипуляции, рендеринг', icon: '🌐', lessons: 4 },
            { id: 'testing', title: 'Тестирование', description: 'Unit-тесты, моки, TDD', icon: '🧪', lessons: 3 }
        ];
    }

    async init(user) {
        this.user = user;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'module-selector';
        this.element.innerHTML = this.getHTML();
        this.bindEvents();
        this.loadProgress();
        return this.element;
    }

    getHTML() {
        const userName = this.user?.username || 'Гость';
        return `
            <header class="app-header">
                <div class="header-left">
                    <h1>🧪 Praxis Sandbox</h1>
                </div>
                <div class="header-right">
                    <span class="user-name">${userName}</span>
                    <button id="logout-btn" class="btn btn-secondary">Выйти</button>
                </div>
            </header>

            <main class="module-list">
                <section class="module-section">
                    <h2>Доступные модули</h2>
                    <div class="modules-grid" id="modules-grid">
                        ${this.modules.map(module => `
                            <article class="module-card" data-module-id="${module.id}">
                                <div class="module-icon">${module.icon}</div>
                                <div class="module-info">
                                    <h3>${module.title}</h3>
                                    <p>${module.description}</p>
                                    <span class="module-meta">${module.lessons} уроков</span>
                                </div>
                                <div class="module-progress" id="progress-${module.id}">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 0%"></div>
                                    </div>
                                    <span class="progress-text">0/${module.lessons}</span>
                                </div>
                                <button class="btn btn-primary module-start" data-module-id="${module.id}">
                                    ${this.getModuleButtonText(module.id)}
                                </button>
                            </article>
                        `).join('')}
                    </div>
                </section>
            </main>
        `;
    }

    getModuleButtonText(moduleId) {
        return 'Начать';
    }

    async loadProgress() {
        if (!this.user) return;

        try {
            for (const module of this.modules) {
                const progress = await idb.progress.list(this.user.username, module.id);
                const completed = progress.filter(p => p.completed).length;
                const total = module.lessons;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                const progressFill = this.element.querySelector(`#progress-${module.id} .progress-fill`);
                const progressText = this.element.querySelector(`#progress-${module.id} .progress-text`);
                const startBtn = this.element.querySelector(`.module-start[data-module-id="${module.id}"]`);

                if (progressFill) progressFill.style.width = `${percentage}%`;
                if (progressText) progressText.textContent = `${completed}/${total}`;
                if (startBtn) {
                    if (completed === total) {
                        startBtn.textContent = 'Повторить';
                        startBtn.classList.add('btn-success');
                    } else if (completed > 0) {
                        startBtn.textContent = 'Продолжить';
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    bindEvents() {
        this.element.querySelector('#logout-btn').addEventListener('click', () => {
            auth.clearToken();
            this.onLogout();
        });

        this.element.querySelectorAll('.module-start').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.moduleId;
                this.onModuleSelect(moduleId);
            });
        });

        this.element.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('module-start')) {
                    const moduleId = card.dataset.moduleId;
                    this.onModuleSelect(moduleId);
                }
            });
        });
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default ModuleSelector;