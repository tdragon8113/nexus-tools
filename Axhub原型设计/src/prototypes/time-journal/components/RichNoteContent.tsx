import React, { useMemo } from 'react';
import { hasNoteContent, normalizeNoteHtml } from '../noteRichText';

type RichNoteContentProps = {
    html?: string;
    emptyText?: string;
    className?: string;
};

export default function RichNoteContent({
    html,
    emptyText = '暂无备注',
    className = '',
}: RichNoteContentProps) {
    const content = useMemo(() => normalizeNoteHtml(html), [html]);

    if (!hasNoteContent(html)) {
        return <p className={`tj-rich-note-empty ${className}`.trim()}>{emptyText}</p>;
    }

    return (
        <div
            className={`tj-rich-note-content ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
