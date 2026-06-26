import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Activity, ActivityCategoryConfig } from '../../data';
import CategoryManageSection from './CategoryManageSection';

type CategoryManagePageProps = {
    categories: ActivityCategoryConfig[];
    activities: Activity[];
    onBack: () => void;
    onAdd: (category: ActivityCategoryConfig) => void;
    onUpdate: (id: string, patch: Partial<Omit<ActivityCategoryConfig, 'id'>>) => void;
    onDelete: (id: string) => string | null;
};

export default function CategoryManagePage({
    categories,
    activities,
    onBack,
    onAdd,
    onUpdate,
    onDelete,
}: CategoryManagePageProps) {
    return (
        <div className="tj-page tj-subpage">
            <header className="tj-subpage-sticky-head">
                <button type="button" className="tj-back-btn" onClick={onBack}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                <h1>活动类型管理</h1>
                <p className="tj-page-lead">自定义记录时的活动分类，修改后记录页同步更新。</p>
            </header>

            <CategoryManageSection
                categories={categories}
                activities={activities}
                onAdd={onAdd}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        </div>
    );
}
