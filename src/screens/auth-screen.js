import { auth } from '../db/auth.js';

export class AuthScreen {
    constructor(onAuthSuccess) {
        this.onAuthSuccess = onAuthSuccess;
        this.isRegisterMode = false;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'auth-screen';
        this.element.innerHTML = this.getHTML();
        this.bindEvents();
        return this.element;
    }

    getHTML() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">🧪</div>
                        <h1>Praxis Sandbox</h1>
                        <p class="auth-subtitle">${this.isRegisterMode ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>
                    </div>

                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <label for="username">Имя пользователя</label>
                            <input type="text" id="username" name="username" required autocomplete="username" minlength="3" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label for="password">Пароль</label>
                            <input type="password" id="password" name="password" required autocomplete="${this.isRegisterMode ? 'new-password' : 'current-password'}" minlength="6">
                        </div>

                        ${this.isRegisterMode ? `
                            <div class="form-group">
                                <label for="confirm-password">Подтвердите пароль</label>
                                <input type="password" id="confirm-password" name="confirmPassword" required autocomplete="new-password" minlength="6">
                            </div>
                        ` : ''}

                        <button type="submit" class="btn btn-primary btn-block" id="submit-btn">
                            <span class="btn-text">${this.isRegisterMode ? 'Зарегистрироваться' : 'Войти'}</span>
                            <span class="btn-loader" hidden></span>
                        </button>

                        <div id="auth-error" class="auth-error" hidden></div>

                        <p class="auth-toggle">
                            ${this.isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                            <button type="button" id="toggle-mode" class="btn-link">
                                ${this.isRegisterMode ? 'Войти' : 'Зарегистрироваться'}
                            </button>
                        </p>
                    </form>

                    <div class="auth-footer">
                        <p>Офлайн-режим: данные хранятся локально в браузере</p>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const form = this.element.querySelector('#auth-form');
        const toggleBtn = this.element.querySelector('#toggle-mode');
        const errorDiv = this.element.querySelector('#auth-error');
        const submitBtn = this.element.querySelector('#submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        toggleBtn.addEventListener('click', () => {
            this.isRegisterMode = !this.isRegisterMode;
            this.element.innerHTML = this.getHTML();
            this.bindEvents();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.hidden = true;
            errorDiv.textContent = '';

            submitBtn.disabled = true;
            btnText.hidden = true;
            btnLoader.hidden = false;

            const formData = new FormData(form);
            const username = formData.get('username').trim();
            const password = formData.get('password');

            try {
                if (this.isRegisterMode) {
                    const confirmPassword = formData.get('confirmPassword');

                    if (password !== confirmPassword) {
                        throw new Error('Пароли не совпадают');
                    }

                    if (password.length < 6) {
                        throw new Error('Пароль должен содержать минимум 6 символов');
                    }

                    await auth.register(username, password);
                } else {
                    await auth.login(username, password);
                }

                const token = auth.getToken();
                if (token) {
                    this.onAuthSuccess();
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.hidden = false;
            } finally {
                submitBtn.disabled = false;
                btnText.hidden = false;
                btnLoader.hidden = true;
            }
        });
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default AuthScreen;