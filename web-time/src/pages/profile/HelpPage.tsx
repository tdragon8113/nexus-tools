import { useNavigate } from 'react-router-dom';
import SubpageHeader from '../../components/SubpageHeader';

const helpSections = [
    {
        title: '快速记录',
        body: '底部点「记录」，选择活动类型并填写名称，开始计时。结束后补充心情和备注，保存即可。',
    },
    {
        title: '首页时间线',
        body: '首页可查看今日活动、累计时长与等级经验。点击某条活动可查看详情；进行中的记录会显示在列表顶部。',
    },
    {
        title: '今日感悟',
        body: '首页「今日感悟」支持富文本编辑，可记录当天的感受与收获。',
    },
    {
        title: '月总结与年总结',
        body: '在「我的 → 感悟与总结」中可分别查看和编写日感悟、月总结、年总结，每个周期支持新增与编辑。',
    },
    {
        title: '统计',
        body: '「统计」页可按今天、本周、本月等时间范围查看类型分布、每日概览和时段汇总（按开始时间归入深夜/上午/下午/晚上）。',
    },
    {
        title: '账户',
        body: '登录后，头像区会显示昵称和账户名。在「设置 → 账户管理」中可修改密码或退出登录。',
    },
    {
        title: '活动类型',
        body: '在「我的 → 设置 → 活动类型管理」中可新增或调整分类，记录页会同步更新。',
    },
];

export default function HelpPage() {
    const navigate = useNavigate();

    return (
        <div className="tj-page tj-subpage">
            <SubpageHeader title="使用帮助" onBack={() => navigate('/profile')} />

            <div className="tj-help-list">
                {helpSections.map((section) => (
                    <article key={section.title} className="tj-card tj-help-card">
                        <h2>{section.title}</h2>
                        <p>{section.body}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}
