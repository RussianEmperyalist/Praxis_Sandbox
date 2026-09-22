// Pure helpers for rendering and grading lesson steps.
// No DOM and no IndexedDB here, so the logic can be unit-tested in Node.

export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderInline(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
}

// Minimal Markdown subset used by the lesson protocols: headings, fenced code,
// lists, quotes, paragraphs and inline code/bold/italic.
export function renderMarkdown(markdown) {
    if (!markdown) return '';

    const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let inFence = false;
    let fenceLines = [];
    let listType = null;

    const closeList = () => {
        if (listType) {
            html += `</${listType}>`;
            listType = null;
        }
    };

    for (const rawLine of lines) {
        const line = rawLine.replace(/\s+$/, '');

        if (line.trim().startsWith('```')) {
            if (inFence) {
                html += `<pre><code>${escapeHtml(fenceLines.join('\n'))}</code></pre>`;
                fenceLines = [];
                inFence = false;
            } else {
                closeList();
                inFence = true;
            }
            continue;
        }

        if (inFence) {
            fenceLines.push(rawLine);
            continue;
        }

        const text = line.trim();
        if (!text) {
            closeList();
            continue;
        }

        const heading = text.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            html += `<h${level}>${renderInline(heading[2])}</h${level}>`;
            continue;
        }

        const unordered = text.match(/^[-*+]\s+(.*)$/);
        if (unordered) {
            if (listType !== 'ul') {
                closeList();
                html += '<ul>';
                listType = 'ul';
            }
            html += `<li>${renderInline(unordered[1])}</li>`;
            continue;
        }

        const ordered = text.match(/^\d+[.)]\s+(.*)$/);
        if (ordered) {
            if (listType !== 'ol') {
                closeList();
                html += '<ol>';
                listType = 'ol';
            }
            html += `<li>${renderInline(ordered[1])}</li>`;
            continue;
        }

        const quote = text.match(/^>\s?(.*)$/);
        if (quote) {
            closeList();
            html += `<blockquote>${renderInline(quote[1])}</blockquote>`;
            continue;
        }

        closeList();
        html += `<p>${renderInline(text)}</p>`;
    }

    if (inFence) {
        html += `<pre><code>${escapeHtml(fenceLines.join('\n'))}</code></pre>`;
    }
    closeList();

    return html;
}

// Deterministic shuffle so the same step always presents options in the same order.
export function shuffleBySeed(items, seed) {
    const array = [...items];
    let state = 0;
    for (const char of String(seed)) {
        state = (state * 31 + char.charCodeAt(0)) >>> 0;
    }
    const random = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function stepMaxPoints(step) {
    return typeof step.points === 'number' ? step.points : 0;
}

export function lessonMaxPoints(steps) {
    return (steps || []).reduce((sum, step) => sum + stepMaxPoints(step), 0);
}

// Answers are compared ignoring case and spaces, so "[1, 2]" and "[1,2]" match.
export function normalizeAnswer(value) {
    return String(value == null ? '' : value).toLowerCase().replace(/\s+/g, '');
}

export function gradeQuiz(step, selectedIndex) {
    return typeof selectedIndex === 'number' && selectedIndex === step.quiz_correct_index;
}

// answers: array aligned with step.table_rows indexes
export function gradeTable(step, answers) {
    const rows = step.table_rows || [];
    let correct = 0;
    rows.forEach((row, index) => {
        if (normalizeAnswer(answers[index]) === normalizeAnswer(row.expected_value)) correct++;
    });
    return { correct, total: rows.length };
}

// answers: array aligned with step.matching_pairs indexes, holding the chosen right side
export function gradeMatching(step, answers) {
    const pairs = step.matching_pairs || [];
    let correct = 0;
    pairs.forEach((pair, index) => {
        if (answers[index] === pair.right) correct++;
    });
    return { correct, total: pairs.length };
}

// programming/sql steps carry check_rules as text, so they are self-graded by the learner.
export function isSelfGraded(step) {
    return step.task_type === 'programming' || step.task_type === 'sql';
}

export const PHASE_LABELS = {
    guided: 'Разбор',
    independent: 'Практика',
    capstone: 'Проект'
};

export const TYPE_LABELS = {
    quiz: 'Вопрос',
    table: 'Таблица',
    matching: 'Сопоставление',
    programming: 'Код',
    sql: 'SQL'
};
