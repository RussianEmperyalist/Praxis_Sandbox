import { auth } from '../db/auth.js';
import { idb } from '../db/idb.js';

export class ModuleSelector {
    constructor(onModuleSelect, onLogout) {
        this.onModuleSelect = onModuleSelect;
        this.onLogout = onLogout;
        this.element = null;
        this.user = null;
        this.blocks = [
            {
                id: 'python_development',
                title: 'Разработка на Python',
                description: 'Основы Python, функции, ООП, исключения — полный курс',
                icon: '🐍',
                modules: [
                    { id: 'python_core', title: 'Python Core', description: 'Переменные, типы, арифметика, строки', icon: '📝', lessons: 10 },
                    { id: 'python_functions', title: 'Функции и модули', description: 'Определение, замыкания, модули, пакеты', icon: '⚙️', lessons: 30 },
                    { id: 'python_exceptions', title: 'Исключения', description: 'Обработка ошибок, кастомные исключения', icon: '⚠️', lessons: 20 },
                    { id: 'python_oop', title: 'ООП', description: 'Классы, наследование, магические методы', icon: '🏗️', lessons: 30 },
                    { id: 'python_capstone', title: 'Капстоун 1: Менеджер задач', description: 'Итоговый проект: CLI таск-менеджер', icon: '🎯', lessons: 10 }
                ]
            },
            {
                id: 'sql',
                title: 'SQL и Базы Данных',
                description: 'От основ до сложных запросов, расширяет Python-проект',
                icon: '🗄️',
                modules: [
                    { id: 'sql_basics', title: 'SQL Basics', description: 'SELECT, WHERE, JOIN, агрегация', icon: '📊', lessons: 10 },
                    { id: 'sql_queries', title: 'Продвинутые запросы', description: 'Подзапросы, CTE, оконные функции', icon: '🔍', lessons: 10 },
                    { id: 'sql_capstone', title: 'Капстоун 2: Расширение проекта', description: 'Добавляем БД в менеджер задач', icon: '🎯', lessons: 10 }
                ]
            },
            {
                id: 'web_api',
                title: 'Web / API',
                description: 'HTTP, REST, фреймворки, деплой — расширяет SQL-проект',
                icon: '🌐',
                modules: [
                    { id: 'web_api_basics', title: 'Web/API Basics', description: 'HTTP, REST, JSON, запросы', icon: '📡', lessons: 10 },
                    { id: 'web_api_frameworks', title: 'Фреймворки', description: 'FastAPI/Flask, маршрутизация, валидация', icon: '⚡', lessons: 10 },
                    { id: 'web_api_capstone', title: 'Капстоун 3: Полноценное API', description: 'Деплой API с БД и авторизацией', icon: '🎯', lessons: 10 }
                ]
            },
            {
                id: 'testing',
                title: 'Тестирование',
                description: 'Unit-тесты, моки, TDD — отдельный блок',
                icon: '🧪',
                modules: [
                    { id: 'testing', title: 'Тестирование', description: 'pytest, моки, TDD, CI', icon: '🧪', lessons: 10 }
                ]
            },
            {
                id: 'git',
                title: 'Git',
                description: 'Версионный контроль — отдельный блок',
                icon: '📦',
                modules: [
                    { id: 'git_basics', title: 'Git Basics', description: 'commit, branch, merge, rebase, remote', icon: '📦', lessons: 10 }
                ]
            },
            {
                id: 'docker',
                title: 'Docker / Podman',
                description: 'Контейнеризация — отдельный блок',
                icon: '🐳',
                modules: [
                    { id: 'docker_basics', title: 'Docker Basics', description: 'Dockerfile, compose, volumes, сети', icon: '🐳', lessons: 10 }
                ]
            }
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
                ${this.blocks.map(block => `
                    <section class="module-section block-section" data-block-id="${block.id}">
                        <div class="block-header">
                            <span class="block-icon">${block.icon}</span>
                            <div class="block-info">
                                <h2>${block.title}</h2>
                                <p class="block-description">${block.description}</p>
                            </div>
                        </div>
                        <div class="modules-grid" id="modules-grid-${block.id}">
                            ${block.modules.map(module => `
                                <article class="module-card" data-module-id="${module.id}" data-block-id="${block.id}">
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
                                    <button class="btn btn-primary module-start" data-module-id="${module.id}" data-block-id="${block.id}">
                                        ${this.getModuleButtonText(module.id)}
                                    </button>
                                </article>
                            `).join('')}
                        </div>
                    </section>
                `).join('')}
            </main>
        `;
    }

    getModuleButtonText(moduleId) {
        return 'Начать';
    }

    async loadProgress() {
        if (!this.user) return;

        try {
            for (const block of this.blocks) {
                for (const module of block.modules) {
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