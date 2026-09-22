import { getModule } from '../data/catalog.js';

// Resolved from this module so lesson URLs work from any base path,
// including GitHub Pages project pages served from a subdirectory.
const APP_ROOT = new URL('../../', import.meta.url);

export function lessonUrl(lesson) {
    return new URL(`labs_protocols/${lesson.file}`, APP_ROOT).href;
}

export async function loadLessonProtocol(lesson) {
    const response = await fetch(lessonUrl(lesson));
    if (!response.ok) {
        throw new Error(`Не удалось загрузить урок ${lesson.id}: HTTP ${response.status}`);
    }
    return response.json();
}

// Returns the module lessons enriched with their step arrays, used both by the
// lesson view and by the progress calculation on the module screen.
export async function loadModuleLessons(moduleId) {
    const module = getModule(moduleId);
    if (!module) return [];

    const lessons = [];
    for (const lesson of module.lessons) {
        try {
            const protocol = await loadLessonProtocol(lesson);
            lessons.push({ ...lesson, title: protocol?.meta?.title || lesson.title, steps: protocol?.steps || [] });
        } catch (error) {
            console.error(error);
            lessons.push({ ...lesson, steps: [] });
        }
    }
    return lessons;
}
