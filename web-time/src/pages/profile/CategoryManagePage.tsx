import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryManageSection from './CategoryManageSection';

export default function CategoryManagePage() {
    const navigate = useNavigate();

    return (
        <div className="tj-page tj-subpage">
            <header className="tj-subpage-sticky-head">
                <button type="button" className="tj-back-btn" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                <h1>活动类型管理</h1>
                <p className="tj-page-lead">自定义记录时的活动分类，修改后记录页同步更新。</p>
            </header>

            <CategoryManageSection />
        </div>
    );
}
