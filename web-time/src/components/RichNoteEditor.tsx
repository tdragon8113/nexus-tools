import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Bold, Italic, Link, List, ListOrdered, Underline } from 'lucide-react';
import { isNoteHtmlEmpty, normalizeNoteHtml, sanitizeNoteHtml } from '../domain/noteRichText';

type RichNoteEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

type ToolbarAction = {
    label: string;
    icon: ReactNode;
    command: string;
    value?: string;
};

type ActiveFormats = {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    unorderedList: boolean;
    orderedList: boolean;
    link: boolean;
};

const emptyActiveFormats = (): ActiveFormats => ({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    link: false,
});

const toolbarActions: ToolbarAction[] = [
    { label: '加粗', icon: <Bold size={16} />, command: 'bold' },
    { label: '斜体', icon: <Italic size={16} />, command: 'italic' },
    { label: '下划线', icon: <Underline size={16} />, command: 'underline' },
    { label: '无序列表', icon: <List size={16} />, command: 'insertUnorderedList' },
    { label: '有序列表', icon: <ListOrdered size={16} />, command: 'insertOrderedList' },
    { label: '链接', icon: <Link size={16} />, command: 'createLink' },
];

function isSelectionInEditor(editor: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return false;
    }
    const anchor = selection.anchorNode;
    return Boolean(anchor && editor.contains(anchor));
}

function isSelectionInLink(editor: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return false;
    }
    let node: Node | null = selection.anchorNode;
    while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

function readActiveFormats(editor: HTMLElement): ActiveFormats {
    if (!isSelectionInEditor(editor)) {
        return emptyActiveFormats();
    }

    return {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        link: isSelectionInLink(editor),
    };
}

function isActionActive(command: string, activeFormats: ActiveFormats): boolean {
    switch (command) {
        case 'bold':
            return activeFormats.bold;
        case 'italic':
            return activeFormats.italic;
        case 'underline':
            return activeFormats.underline;
        case 'insertUnorderedList':
            return activeFormats.unorderedList;
        case 'insertOrderedList':
            return activeFormats.orderedList;
        case 'createLink':
            return activeFormats.link;
        default:
            return false;
    }
}

function placeCaretAtStart(editor: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
}

function normalizeEditorIfEmpty(editor: HTMLElement): boolean {
    if (!isNoteHtmlEmpty(editor.innerHTML)) {
        return false;
    }
    editor.innerHTML = '';
    return true;
}

export default function RichNoteEditor({
    value,
    onChange,
    placeholder = '写下这次活动的细节或想法',
}: RichNoteEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastValueRef = useRef<string | null>(null);
    const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyActiveFormats);
    const [isEmpty, setIsEmpty] = useState(() => !value || isNoteHtmlEmpty(value));

    const refreshToolbarState = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        setActiveFormats(readActiveFormats(editor));
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || lastValueRef.current === value) {
            return;
        }
        if (!value || isNoteHtmlEmpty(value)) {
            editor.innerHTML = '';
            setIsEmpty(true);
        } else {
            editor.innerHTML = normalizeNoteHtml(value);
            setIsEmpty(false);
        }
        lastValueRef.current = value;
        refreshToolbarState();
    }, [value, refreshToolbarState]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return undefined;
        }

        const handleSelectionChange = () => {
            if (isSelectionInEditor(editor)) {
                refreshToolbarState();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        editor.addEventListener('keyup', refreshToolbarState);
        editor.addEventListener('mouseup', refreshToolbarState);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            editor.removeEventListener('keyup', refreshToolbarState);
            editor.removeEventListener('mouseup', refreshToolbarState);
        };
    }, [refreshToolbarState]);

    const handleEditorFocus = () => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        if (normalizeEditorIfEmpty(editor)) {
            setIsEmpty(true);
            placeCaretAtStart(editor);
        }
        refreshToolbarState();
    };

    const handleEditorClick = () => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        window.requestAnimationFrame(() => {
            if (normalizeEditorIfEmpty(editor)) {
                setIsEmpty(true);
                placeCaretAtStart(editor);
            }
        });
    };

    const emitChange = () => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        const empty = normalizeEditorIfEmpty(editor);
        const html = empty ? '' : sanitizeNoteHtml(editor.innerHTML);
        setIsEmpty(empty);
        lastValueRef.current = html;
        onChange(html);
        refreshToolbarState();
    };

    const runCommand = (command: string, commandValue?: string) => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        editor.focus();

        if (command === 'createLink') {
            const url = window.prompt('输入链接地址（需以 http:// 或 https:// 开头）');
            if (!url?.trim()) {
                refreshToolbarState();
                return;
            }
            document.execCommand('createLink', false, url.trim());
            emitChange();
            return;
        }

        document.execCommand(command, false, commandValue);
        emitChange();
    };

    return (
        <div className="tj-rich-note">
            <div className="tj-rich-note-toolbar" role="toolbar" aria-label="备注格式">
                {toolbarActions.map((action) => {
                    const active = isActionActive(action.command, activeFormats);
                    return (
                        <button
                            key={action.label}
                            type="button"
                            className={`tj-rich-note-tool ${active ? 'tj-rich-note-tool-active' : ''}`}
                            aria-label={action.label}
                            aria-pressed={active}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => runCommand(action.command, action.value)}
                        >
                            {action.icon}
                        </button>
                    );
                })}
            </div>
            <div className="tj-rich-note-body">
                {isEmpty ? (
                    <div className="tj-rich-note-placeholder" aria-hidden="true">
                        {placeholder}
                    </div>
                ) : null}
                <div
                    ref={editorRef}
                    className="tj-rich-note-editor"
                    contentEditable
                    role="textbox"
                    aria-multiline="true"
                    aria-label={placeholder}
                    suppressContentEditableWarning
                    onInput={emitChange}
                    onBlur={emitChange}
                    onFocus={handleEditorFocus}
                    onClick={handleEditorClick}
                />
            </div>
        </div>
    );
}
