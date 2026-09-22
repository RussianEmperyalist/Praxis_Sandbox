#!/usr/bin/env node
/**
 * validate_content.cjs — Валидатор протоколов уроков
 * Запуск: node validate_content.cjs
 * Рекурсивно проверяет все .json в labs_protocols/ (кроме игнорируемых)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'labs_protocols');
const IGNORE_DIRS = ['_archive', '_dev_fixtures'];
const REPORT_PATH = path.join(ROOT, '_validation_report.txt');

const VALID_BLOCKS = new Set(['python_core', 'sql_db', 'web_api']);
const VALID_PHASES = new Set(['guided', 'independent', 'capstone']);
const VALID_TASK_TYPES = new Set(['quiz', 'table', 'matching', 'programming', 'sql']);
const VALID_POINTS = new Set([1, 5, 10, 20]);
const REQUIRED_TOP = ['lesson_id', 'block', 'meta', 'steps'];
const REQUIRED_META = ['title', 'topic_order'];
const REQUIRED_STEP = ['step_id', 'phase', 'task_type', 'points', 'markdown_text', 'hint_levels'];
const REQUIRED_BY_TYPE = {
    quiz: ['quiz_options', 'quiz_correct_index'],
    table: ['table_rows'],
    matching: ['matching_pairs'],
    programming: ['starter_code', 'check_rules'],
    sql: ['starter_query', 'expected_result_rows', 'seed_schema_ref']
};

let reportLines = [];
let stats = { passed: 0, total: 0, failed: 0, fails: [] };

function logReport(...args) {
    reportLines.push(args.join(' '));
}

function countWords(text) {
    // Удаляем фенс-блоки и markdown-разметку для подсчёта слов
    const noFences = text.replace(/```[\s\S]*?```/g, '');
    const noMd = noFences
        .replace(/[*_`#>~\-\[\]()]/g, ' ')
        .replace(/\s+/g, ' ');
    return noMd.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countFenceBlocks(text) {
    const matches = text.match(/```[\w]*\n[\s\S]*?```/g);
    return matches ? matches.length : 0;
}

function hasMultilineCodeOutsideFences(text) {
    // Ищем строки с отступом (4+ пробела или таб), не внутри фенс-блоков
    let inFence = false;
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (!inFence && /^(\s{4,}|\t)./.test(line)) {
            // Пропускаем если это внутри списка markdown (начинается с - или *)
            if (!/^\s*[-*]\s/.test(line)) return true;
        }
    }
    return false;
}

function countMistakes(text) {
    // Ищем блоки "Ошибка" ... "Правильно" ... "Почему" (даже через переносы строк)
    const patterns = [
        /Ошибка[\s\S]*?Правильно[\s\S]*?Почему[\s\S]*?(?=Ошибка|$)/gi,
        /❌[\s\S]*?✅[\s\S]*?💡/g,
        /ошибк[аи][\s\S]*?правильн[оаы][\s\S]*?пochemu/gi
    ];
    let count = 0;
    for (const p of patterns) {
        const matches = text.match(p);
        if (matches) count += matches.length;
    }
    // Fallback: считаем количество "Ошибка" и "Правильно" маркеров
    if (count < 2) {
        const errMatches = text.match(/Ошибка[:\s]/gi);
        const corrMatches = text.match(/Правильно[:\s]/gi);
        if (errMatches && corrMatches) count = Math.min(errMatches.length, corrMatches.length);
    }
    // Last resort: count "Ошибка" markers alone
    if (count < 2) {
        const errOnly = text.match(/Ошибка[^*]*?:/gi);
        if (errOnly) count = errOnly.length;
    }
    return count;
}

function validateFile(filePath) {
    const relPath = path.relative(ROOT, filePath);
    const errors = [];
    const warnings = [];

    let content;
    try {
        content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        return { ok: false, errors: [`Invalid JSON: ${e.message}`], warnings: [] };
    }

    // 1. Top-level
    for (const f of REQUIRED_TOP) {
        if (!content[f]) errors.push(`Missing top-level field: ${f}`);
    }
    if (content.block && !VALID_BLOCKS.has(content.block)) {
        errors.push(`Invalid block: ${content.block}`);
    }
    if (content.meta) {
        for (const f of REQUIRED_META) {
            if (!content.meta[f]) errors.push(`Missing meta.${f}`);
        }
        if (typeof content.meta.topic_order !== 'number' || content.meta.topic_order < 1) {
            errors.push('meta.topic_order must be positive number');
        }
    }

    // 2. Steps
    if (!Array.isArray(content.steps) || content.steps.length === 0) {
        errors.push('steps must be non-empty array');
    } else {
        const stepIds = new Set();
        let independentCounts = { quiz: 0, table: 0, matching: 0, programming: 0, sql: 0 };

        content.steps.forEach((step, idx) => {
            const prefix = `steps[${idx}]`;

            for (const f of REQUIRED_STEP) {
                if (!step[f]) errors.push(`${prefix}: missing ${f}`);
            }

            if (step.step_id) {
                if (stepIds.has(step.step_id)) errors.push(`${prefix}: duplicate step_id ${step.step_id}`);
                else stepIds.add(step.step_id);
            }

            if (step.phase && !VALID_PHASES.has(step.phase)) {
                errors.push(`${prefix}: invalid phase ${step.phase}`);
            }
            if (step.task_type && !VALID_TASK_TYPES.has(step.task_type)) {
                errors.push(`${prefix}: invalid task_type ${step.task_type}`);
            }
            if (step.points && !VALID_POINTS.has(step.points)) {
                errors.push(`${prefix}: invalid points ${step.points}`);
            }
            if (step.hint_levels) {
                if (!Array.isArray(step.hint_levels) || step.hint_levels.length !== 3) {
                    errors.push(`${prefix}: hint_levels must be array of 3 strings`);
                }
            }

            // Type-specific fields
            if (step.task_type && REQUIRED_BY_TYPE[step.task_type]) {
                for (const f of REQUIRED_BY_TYPE[step.task_type]) {
                    if (step[f] === undefined || step[f] === null) errors.push(`${prefix}: missing ${f} for ${step.task_type}`);
                }
                // Extra validation per type
                if (step.task_type === 'quiz') {
                    if (!Array.isArray(step.quiz_options) || step.quiz_options.length < 3) {
                        errors.push(`${prefix}: quiz_options need ≥3 items`);
                    }
                    if (typeof step.quiz_correct_index !== 'number' ||
                        step.quiz_correct_index < 0 ||
                        step.quiz_correct_index >= (step.quiz_options?.length || 0)) {
                        errors.push(`${prefix}: quiz_correct_index out of range`);
                    }
                }
                if (step.task_type === 'table') {
                    if (!Array.isArray(step.table_rows) || step.table_rows.length < 1) {
                        errors.push(`${prefix}: table_rows need ≥1 item`);
                    } else {
                        step.table_rows.forEach((r, ri) => {
                            if (!r.label || !r.expected_value) {
                                errors.push(`${prefix}.table_rows[${ri}]: need label and expected_value`);
                            }
                        });
                    }
                }
                if (step.task_type === 'matching') {
                    if (!Array.isArray(step.matching_pairs) || step.matching_pairs.length < 3) {
                        errors.push(`${prefix}: matching_pairs need ≥3 pairs`);
                    } else {
                        step.matching_pairs.forEach((p, pi) => {
                            if (!p.left || !p.right) {
                                errors.push(`${prefix}.matching_pairs[${pi}]: need left and right`);
                            }
                        });
                    }
                }
                if (step.task_type === 'programming') {
                    if (typeof step.starter_code !== 'string') errors.push(`${prefix}: starter_code must be string`);
                    if (!Array.isArray(step.check_rules) || step.check_rules.length < 1) {
                        errors.push(`${prefix}: check_rules need ≥1 item`);
                    }
                }
                if (step.task_type === 'sql') {
                    if (typeof step.starter_query !== 'string') errors.push(`${prefix}: starter_query must be string`);
                    if (!Array.isArray(step.expected_result_rows)) errors.push(`${prefix}: expected_result_rows must be array`);
                    if (typeof step.seed_schema_ref !== 'string') errors.push(`${prefix}: seed_schema_ref must be string`);
                }
            }

            // tutorial_guidance validation for guided
            if (step.phase === 'guided') {
                if (!step.tutorial_guidance || typeof step.tutorial_guidance !== 'string' || step.tutorial_guidance.trim().length === 0) {
                    errors.push(`${prefix}: tutorial_guidance required for guided phase`);
                } else {
                    const tg = step.tutorial_guidance;
                    const wc = countWords(tg);
                    if (wc < 300 || wc > 500) {
                        errors.push(`${prefix}: tutorial_guidance word count ${wc} not in 300-500`);
                    }
                    const fences = countFenceBlocks(tg);
                    if (fences < 2) {
                        errors.push(`${prefix}: tutorial_guidance needs ≥2 code fence blocks, found ${fences}`);
                    }
                    const mistakes = countMistakes(tg);
                    if (mistakes < 2) {
                        errors.push(`${prefix}: tutorial_guidance needs ≥2 distinct common mistakes, found ${mistakes}`);
                    }
                    if (hasMultilineCodeOutsideFences(tg)) {
                        errors.push(`${prefix}: multiline code found outside fence blocks`);
                    }
                }
            }

            // Count independent phases
            if (step.phase === 'independent') {
                independentCounts[step.task_type] = (independentCounts[step.task_type] || 0) + 1;
            }
        });

        // 3. Independent proportions
        const ind = independentCounts;
        if (ind.quiz < 3) errors.push(`independent: quiz ${ind.quiz} < 3`);
        if (ind.table < 2) errors.push(`independent: table ${ind.table} < 2`);
        if (ind.matching < 1) errors.push(`independent: matching ${ind.matching} < 1`);
        const progSql = ind.programming + ind.sql;
        const other = ind.quiz + ind.table + ind.matching;
        if (progSql < other) errors.push(`independent: programming+sql (${progSql}) should be ≥ quiz+table+matching (${other})`);
    }

    return { ok: errors.length === 0, errors, warnings };
}

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (IGNORE_DIRS.includes(entry.name)) continue;
            walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            stats.total++;
            const result = validateFile(full);
            const rel = path.relative(ROOT, full);
            if (result.ok) {
                stats.passed++;
                logReport(`✅ ${rel} — OK`);
            } else {
                stats.failed++;
                stats.fails.push({ file: rel, reason: result.errors[0] });
                logReport(`❌ ${rel} — ${result.errors.join('; ')}`);
            }
            if (result.warnings.length) {
                result.warnings.forEach(w => logReport(`  ⚠ ${w}`));
            }
        }
    }
}

// Main
logReport(`=== VALIDATION REPORT ${new Date().toISOString()} ===`);
logReport(`Root: ${ROOT}`);
logReport('');

walk(ROOT);

logReport('');
logReport(`SUMMARY passed=${stats.passed} total=${stats.total} failed=${stats.failed}`);
if (stats.fails.length) {
    logReport('FAILED FILES:');
    stats.fails.forEach(f => logReport(`  ${f.file} — ${f.reason}`));
}

// Write detailed report
fs.writeFileSync(REPORT_PATH, reportLines.join('\n'), 'utf-8');

// Console output — ONLY summary
console.log(`SUMMARY passed=${stats.passed} total=${stats.total} failed=${stats.failed}`);
if (stats.fails.length) {
    stats.fails.forEach(f => console.log(`FAIL: ${f.file} — ${f.reason}`));
}

process.exit(stats.failed > 0 ? 1 : 0);