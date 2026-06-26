import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
    Activity,
    ActivityCategoryConfig,
    countActivitiesByCategory,
    createCategoryId,
} from '../../data';

type CategoryManageSectionProps = {
    categories: ActivityCategoryConfig[];
    activities: Activity[];
    onAdd: (category: ActivityCategoryConfig) => void;
    onUpdate: (id: string, patch: Partial<Omit<ActivityCategoryConfig, 'id'>>) => void;
    onDelete: (id: string) => string | null;
};

type EditorState = {
    mode: 'add' | 'edit';
    id?: string;
    label: string;
    emoji: string;
    xpPerHour: number;
};

const emptyEditor = (): EditorState => ({
    mode: 'add',
    label: '',
    emoji: '✨',
    xpPerHour: 15,
});

export default function CategoryManageSection({
    categories,
    activities,
    onAdd,
    onUpdate,
    onDelete,
}: CategoryManageSectionProps) {
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const usageMap = useMemo(() => {
        const map = new Map<string, number>();
        categories.forEach((item) => {
            map.set(item.id, countActivitiesByCategory(activities, item.id));
        });
        return map;
    }, [activities, categories]);

    const openAdd = () => {
        setMessage(null);
        setEditor(emptyEditor());
    };

    const openEdit = (item: ActivityCategoryConfig) => {
        setMessage(null);
        setEditor({
            mode: 'edit',
            id: item.id,
            label: item.label,
            emoji: item.emoji,
            xpPerHour: item.xpPerHour,
        });
    };

    const closeEditor = () => {
        setEditor(null);
    };

    const handleSave = () => {
        if (!editor) {
            return;
        }

        const label = editor.label.trim();
        const emoji = editor.emoji.trim() || '✨';
        const xpPerHour = Math.max(5, Math.min(60, Math.round(editor.xpPerHour)));

        if (!label) {
            setMessage('请填写类型名称');
            return;
        }

        if (editor.mode === 'add') {
            onAdd({
                id: createCategoryId(label, categories),
                label,
                emoji,
                xpPerHour,
            });
            setMessage('已新增活动类型');
        } else if (editor.id) {
            onUpdate(editor.id, { label, emoji, xpPerHour });
            setMessage('已保存修改');
        }

        setEditor(null);
    };

    const handleDelete = (id: string) => {
        const error = onDelete(id);
        if (error) {
            setMessage(error);
            return;
        }
        if (editor?.id === id) {
            setEditor(null);
        }
        setMessage('已删除活动类型');
    };

    return (
        <section className="tj-section tj-category-manage">
            <div className="tj-section-head">
                <span className="tj-field-label">全部类型 · {categories.length} 个</span>
                <button type="button" className="tj-text-btn" onClick={openAdd}>
                    <Plus size={16} />
                    新增
                </button>
            </div>

            <div className="tj-category-list">
                {categories.map((item) => (
                    <article key={item.id} className="tj-category-item">
                        <div className="tj-category-item-main">
                            <span className="tj-category-emoji">{item.emoji}</span>
                            <div>
                                <strong>{item.label}</strong>
                                <p>
                                    {item.xpPerHour} XP/小时 · 已记录 {usageMap.get(item.id) ?? 0} 条
                                </p>
                            </div>
                        </div>
                        <div className="tj-category-item-actions">
                            <button
                                type="button"
                                className="tj-icon-btn"
                                aria-label={`编辑${item.label}`}
                                onClick={() => openEdit(item)}
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                type="button"
                                className="tj-icon-btn tj-icon-btn-danger"
                                aria-label={`删除${item.label}`}
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            {editor ? (
                <div className="tj-card tj-category-editor">
                    <div className="tj-category-editor-head">
                        <strong>{editor.mode === 'add' ? '新增活动类型' : '编辑活动类型'}</strong>
                        <button type="button" className="tj-icon-btn" aria-label="关闭" onClick={closeEditor}>
                            <X size={16} />
                        </button>
                    </div>

                    <div className="tj-category-editor-grid">
                        <label className="tj-field">
                            <span>图标</span>
                            <input
                                className="tj-input tj-input-emoji"
                                maxLength={2}
                                value={editor.emoji}
                                onChange={(event) =>
                                    setEditor((current) =>
                                        current ? { ...current, emoji: event.target.value } : current,
                                    )
                                }
                            />
                        </label>
                        <label className="tj-field">
                            <span>名称</span>
                            <input
                                className="tj-input"
                                placeholder="如：冥想"
                                value={editor.label}
                                onChange={(event) =>
                                    setEditor((current) =>
                                        current ? { ...current, label: event.target.value } : current,
                                    )
                                }
                            />
                        </label>
                        <label className="tj-field">
                            <span>XP / 小时</span>
                            <input
                                className="tj-input"
                                type="number"
                                min={5}
                                max={60}
                                value={editor.xpPerHour}
                                onChange={(event) =>
                                    setEditor((current) =>
                                        current
                                            ? {
                                                  ...current,
                                                  xpPerHour: Number(event.target.value) || 15,
                                              }
                                            : current,
                                    )
                                }
                            />
                        </label>
                    </div>

                    <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={handleSave}>
                        {editor.mode === 'add' ? '添加类型' : '保存修改'}
                    </button>
                </div>
            ) : null}

            {message ? <p className="tj-category-message">{message}</p> : null}
        </section>
    );
}
