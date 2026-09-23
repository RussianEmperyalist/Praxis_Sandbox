import { auth } from '../db/auth.js';
import { idb } from '../db/idb.js';

// App root resolved from this module, so protocol URLs work from any base path
// (project pages like https://user.github.io/repo/ as well as localhost).
const APP_ROOT = new URL('../../', import.meta.url);

export class LessonView {
    constructor(onBack, onComplete) {
        this.onBack = onBack;
        this.onComplete = onComplete;
        this.element = null;
        this.moduleId = null;
        this.lessonIndex = 0;
        this.lessons = [];
        this.protocol = null;
    }

    async init(moduleId, lessonIndex = 0) {
        this.moduleId = moduleId;
        this.lessonIndex = lessonIndex;
        await this.loadProtocol();
    }

    async loadProtocol() {
        try {
            // Direct mapping from moduleId to protocol file path
            const protocolMap = {
                'python_core': 'python_core/python_core.json',
                'python_functions': 'python_functions/python_functions.json',
                'python_exceptions': 'python_exceptions/python_exceptions.json',
                'python_oop': 'python_oop/python_oop.json',
                'python_capstone': 'python_capstone/python_capstone.json',
                'sql_basics': 'sql_basics/sql_basics.json',
                'sql_queries': 'sql_queries/sql_queries.json',
                'sql_capstone': 'sql_capstone/sql_capstone.json',
                'web_api_basics': 'web_api_basics/web_api_basics.json',
                'web_api_frameworks': 'web_api_frameworks/web_api_frameworks.json',
                'web_api_capstone': 'web_api_capstone/web_api_capstone.json',
                'testing': 'testing/testing.json',
                'git_basics': 'git_basics/git_basics.json',
                'docker_basics': 'docker_basics/docker_basics.json'
            };
            
            const relativePath = protocolMap[this.moduleId] || `${this.moduleId}/${this.moduleId}.json`;
            const url = new URL(`labs_protocols/${relativePath}`, APP_ROOT);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Протокол не найден');
            }
            this.protocol = await response.json();
            this.lessons = this.protocol.lessons || [];
        } catch (error) {
            console.error('Failed to load protocol:', error);
            this.protocol = { title: this.moduleId, lessons: [] };
            this.lessons = [];
        }
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'lesson-view';
        this.element.innerHTML = this.getHTML();
        this.bindEvents();
        return this.element;
    }

    getHTML() {
        const lesson = this.lessons[this.lessonIndex];
        const moduleTitle = this.protocol?.title || this.moduleId;
        const lessonTitle = lesson?.title || `Урок ${this.lessonIndex + 1}`;
        const lessonContent = lesson?.content || 'Содержимое урока будет загружено позже.';

        return `
            <header class="app-header lesson-header">
                <div class="header-left">
                    <button id="back-btn" class="btn btn-icon" aria-label="Назад">←</button>
                    <div class="breadcrumb">
                        <span class="module-title">${moduleTitle}</span>
                        <span class="separator">/</span>
                        <span class="lesson-title">${lessonTitle}</span>
                    </div>
                </div>
                <div class="header-right">
                    <span class="lesson-counter">${this.lessonIndex + 1} / ${this.lessons.length}</span>
                </div>
            </header>

            <main class="lesson-content">
                <article class="lesson-article">
                    <div class="lesson-body" id="lesson-body">
                        ${lessonContent}
                    </div>
                </article>

                <aside class="lesson-sidebar" id="lesson-sidebar">
                    <div class="sidebar-section">
                        <h4>Навигация</h4>
                        <nav class="lesson-nav">
                            <ul id="lessons-list">
                                ${this.lessons.map((l, i) => `
                                    <li class="${i === this.lessonIndex ? 'active' : ''} ${i < this.lessonIndex ? 'completed' : ''}"
                                        data-lesson-index="${i}">
                                        <span class="lesson-number">${i + 1}</span>
                                        <span class="lesson-name">${l.title}</span>
                                        ${i < this.lessonIndex ? '<span class="check">✓</span>' : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </nav>
                    </div>

                    <div class="sidebar-section">
                        <div class="lesson-actions">
                            <button id="prev-lesson" class="btn btn-secondary" ${this.lessonIndex === 0 ? 'disabled' : ''}>
                                ← Предыдущий
                            </button>
                            <button id="next-lesson" class="btn btn-primary" ${this.lessonIndex >= this.lessons.length - 1 ? 'disabled' : ''}>
                                Следующий →
                            </button>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <button id="complete-lesson" class="btn btn-success btn-block">
                            Отметить как выполненное
                        </button>
                    </div>
                </aside>
            </main>
        `;
    }

    bindEvents() {
        this.element.querySelector('#back-btn').addEventListener('click', () => {
            this.onBack();
        });

        this.element.querySelector('#prev-lesson').addEventListener('click', () => {
            if (this.lessonIndex > 0) {
                this.goToLesson(this.lessonIndex - 1);
            }
        });

        this.element.querySelector('#next-lesson').addEventListener('click', () => {
            if (this.lessonIndex < this.lessons.length - 1) {
                this.goToLesson(this.lessonIndex + 1);
            }
        });

        this.element.querySelector('#complete-lesson').addEventListener('click', () => {
            this.completeLesson();
        });

        this.element.querySelectorAll('#lessons-list li').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.lessonIndex, 10);
                this.goToLesson(index);
            });
        });
    }

    async goToLesson(index) {
        if (index < 0 || index >= this.lessons.length) return;
        this.lessonIndex = index;
        this.element.innerHTML = this.getHTML();
        this.bindEvents();
    }

    async completeLesson() {
        const token = auth.getToken();
        if (!token) return;

        const session = await auth.validateSession(token);
        if (!session.valid) return;

        try {
            const progressRecord = {
                username: session.username,
                moduleId: this.moduleId,
                lessonIndex: this.lessonIndex,
                completed: true,
                completedAt: Date.now()
            };

            await idb.progress.set(progressRecord);

            this.element.querySelector(`#lessons-list li[data-lesson-index="${this.lessonIndex}"]`)
                ?.classList.add('completed');

            const completeBtn = this.element.querySelector('#complete-lesson');
            if (completeBtn) {
                completeBtn.textContent = 'Выполнено ✓';
                completeBtn.disabled = true;
                completeBtn.classList.remove('btn-success');
                completeBtn.classList.add('btn-secondary');
            }

            if (this.lessonIndex === this.lessons.length - 1) {
                this.onComplete(this.moduleId);
            }
        } catch (error) {
            console.error('Failed to complete lesson:', error);
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default LessonView;