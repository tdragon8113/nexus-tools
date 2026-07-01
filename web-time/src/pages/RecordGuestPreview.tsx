import { Clock3, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { demoStatsCategories } from '../domain/statsDemoData';
import { moodLabels } from '../domain/record';

export default function RecordGuestPreview() {
    const navigate = useNavigate();
    const categories = demoStatsCategories;
    const selectedCategory = categories[0];

    return (
        <div className="tj-page tj-record-guest">
            <div className="tj-stats-demo-banner">
                <div>
                    <strong>示例预览</strong>
                    <span>登录后即可开始实时记录或补录过往活动</span>
                </div>
                <button type="button" className="tj-primary-btn" onClick={() => navigate('/profile')}>
                    去登录
                </button>
            </div>

            <header className="tj-page-header">
                <p className="tj-kicker">开始记录</p>
                <h1>记录一次活动</h1>
                <p className="tj-page-lead">
                    选择活动类型和名称，点击开始后自动计时，保存时一并结束并写入记录。
                </p>
            </header>

            <div className="tj-record-guest-preview" aria-hidden="true">
                <div className="tj-record-mode-switch">
                    <button
                        type="button"
                        className="tj-record-mode-btn tj-record-mode-btn-active"
                        tabIndex={-1}
                    >
                        <Play size={16} />
                        实时记录
                    </button>
                    <button type="button" className="tj-record-mode-btn" tabIndex={-1}>
                        <Clock3 size={16} />
                        补录
                    </button>
                </div>

                <section className="tj-section">
                    <h2 className="tj-field-label">活动类型</h2>
                    <div className="tj-chip-grid">
                        {categories.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`tj-chip ${index === 0 ? 'tj-chip-active' : ''}`}
                                tabIndex={-1}
                            >
                                <span>{item.emoji}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="tj-section">
                    <label className="tj-field">
                        <span className="tj-field-label">活动名称</span>
                        <input
                            className="tj-input"
                            readOnly
                            tabIndex={-1}
                            value="阅读"
                            placeholder={`例如：${selectedCategory.label}`}
                        />
                    </label>
                </section>

                <section className="tj-section">
                    <span className="tj-field-label">心情感受</span>
                    <div className="tj-mood-row">
                        {moodLabels.map((label, index) => {
                            const value = (index + 1) as 1 | 2 | 3 | 4 | 5;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    className={`tj-mood-btn ${value === 4 ? 'tj-mood-btn-active' : ''}`}
                                    tabIndex={-1}
                                >
                                    <strong>{value}</strong>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <button type="button" className="tj-primary-btn tj-primary-btn-block" tabIndex={-1}>
                    <Play size={18} />
                    开始记录
                </button>
            </div>

            <button
                type="button"
                className="tj-primary-btn tj-primary-btn-block tj-record-guest-cta"
                onClick={() => navigate('/profile')}
            >
                登录后开始记录
            </button>
        </div>
    );
}
