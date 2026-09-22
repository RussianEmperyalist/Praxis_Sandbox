// Catalog of available lesson protocols.
// `id` values match the "block" field validated by validate_content.cjs, and every
// lesson `file` is a path relative to labs_protocols/ that must exist on disk.
export const MODULES = [
    {
        id: 'python_core',
        title: 'Основы Python',
        icon: '🐍',
        description: 'Числа, строки, списки, словари, множества и кортежи',
        lessons: [
            {
                id: 'python_core/01_numbers_strings',
                file: 'python_core/01_numbers_strings.json',
                title: 'Числа и строки'
            },
            {
                id: 'python_core/02_lists',
                file: 'python_core/02_lists.json',
                title: 'Списки'
            },
            {
                id: 'python_core/03_dicts_sets_tuples',
                file: 'python_core/03_dicts_sets_tuples.json',
                title: 'Словари, множества и кортежи'
            }
        ]
    },
    {
        id: 'sql_db',
        title: 'Базы данных и SQL',
        icon: '🗄️',
        description: 'Запросы SELECT, JOIN и работа со схемами',
        lessons: []
    },
    {
        id: 'web_api',
        title: 'Веб-API',
        icon: '🌐',
        description: 'Запросы, ответы и работа с HTTP',
        lessons: []
    }
];

export function getModule(moduleId) {
    return MODULES.find(module => module.id === moduleId) || null;
}

export function isAvailable(module) {
    return Array.isArray(module.lessons) && module.lessons.length > 0;
}

export default MODULES;
