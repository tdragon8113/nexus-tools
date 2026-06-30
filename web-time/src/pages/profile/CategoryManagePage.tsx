import { useNavigate } from 'react-router-dom';
import SubpageHeader from '../../components/SubpageHeader';
import CategoryManageSection from './CategoryManageSection';

export default function CategoryManagePage() {
    const navigate = useNavigate();

    return (
        <div className="tj-page tj-subpage">
            <SubpageHeader
                title="活动类型管理"
                lead="自定义记录时的活动分类，修改后记录页同步更新。"
                onBack={() => navigate('/profile')}
            />

            <CategoryManageSection />
        </div>
    );
}
