const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'DIV', 'SPAN']);

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function stripHtml(html: string): string {
    if (!html.includes('<')) {
        return html.trim();
    }
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
}

export function hasNoteContent(note?: string): boolean {
    if (!note) {
        return false;
    }
    return stripHtml(note).length > 0;
}

export function normalizeNoteHtml(note?: string): string {
    if (!note) {
        return '';
    }
    if (note.includes('<')) {
        return sanitizeNoteHtml(note);
    }
    return `<p>${escapeHtml(note)}</p>`;
}

export function sanitizeNoteHtml(html: string): string {
    if (typeof document === 'undefined') {
        return html;
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    const walk = (node: Node) => {
        const children = Array.from(node.childNodes);
        children.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                return;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) {
                child.parentNode?.removeChild(child);
                return;
            }

            const element = child as HTMLElement;
            if (!ALLOWED_TAGS.has(element.tagName)) {
                const fragment = document.createDocumentFragment();
                while (element.firstChild) {
                    fragment.appendChild(element.firstChild);
                }
                element.replaceWith(fragment);
                walk(node);
                return;
            }

            Array.from(element.attributes).forEach((attr) => {
                if (element.tagName === 'A' && attr.name === 'href') {
                    if (!/^https?:\/\//i.test(attr.value)) {
                        element.removeAttribute('href');
                    }
                    return;
                }
                element.removeAttribute(attr.name);
            });

            walk(element);
        });
    };

    walk(template.content);
    return template.innerHTML;
}

export function isNoteHtmlEmpty(html: string): boolean {
    return !hasNoteContent(html);
}
