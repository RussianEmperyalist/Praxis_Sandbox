import { auth } from './db/auth.js';
import { idb } from './db/idb.js';
import { AuthScreen } from './screens/auth-screen.js';
import { ModuleSelector } from './screens/module-selector.js';
import { LessonView } from './screens/lesson-view.js';

class App {
    constructor() {
        this.currentScreen = null;
        this.user = null;
        this.appContainer = document.getElementById('app');
    }

    async init() {
        this.user = await auth.getCurrentUser();

        if (this.user) {
            this.showModuleSelector();
        } else {
            this.showAuthScreen();
        }

        window.addEventListener('beforeunload', () => {
            if (this.currentScreen?.destroy) {
                this.currentScreen.destroy();
            }
        });
    }

    clearContainer() {
        this.appContainer.innerHTML = '';
        if (this.currentScreen?.destroy) {
            this.currentScreen.destroy();
        }
        this.currentScreen = null;
    }

    showAuthScreen() {
        this.clearContainer();
        const authScreen = new AuthScreen(() => {
            this.init();
        });
        this.currentScreen = authScreen;
        this.appContainer.appendChild(authScreen.render());
    }

    async showModuleSelector() {
        this.clearContainer();
        const moduleSelector = new ModuleSelector(
            (moduleId) => this.showLessonView(moduleId),
            () => this.showAuthScreen()
        );
        await moduleSelector.init(this.user);
        this.currentScreen = moduleSelector;
        this.appContainer.appendChild(moduleSelector.render());
    }

    async showLessonView(moduleId, lessonIndex = 0) {
        this.clearContainer();
        const lessonView = new LessonView(
            () => this.showModuleSelector(),
            (completedModuleId) => this.onModuleComplete(completedModuleId)
        );
        await lessonView.init(moduleId, lessonIndex);
        this.currentScreen = lessonView;
        this.appContainer.appendChild(lessonView.render());
    }

    async onModuleComplete(moduleId) {
        alert(`Модуль "${moduleId}" завершён! Поздравляем!`);
        this.showModuleSelector();
    }
}

const app = new App();
app.init();

export default app;