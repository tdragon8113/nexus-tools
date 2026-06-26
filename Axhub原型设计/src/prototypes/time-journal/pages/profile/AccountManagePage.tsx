import React from 'react';
import { ChevronLeft, ChevronRight, Lock, LogOut } from 'lucide-react';
import { AuthSession } from '../../auth';

type AccountManagePageProps = {
    authSession: AuthSession;
    onBack: () => void;
    onOpenChangePassword: () => void;
    onLogout: () => void;
};

export default function AccountManagePage({
    onBack,
    onOpenChangePassword,
    onLogout,
}: AccountManagePageProps) {
    return (
        <div className="tj-page tj-subpage">
            <header className="tj-subpage-sticky-head">
                <button type="button" className="tj-back-btn" onClick={onBack}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                <h1>账户管理</h1>
                <p className="tj-page-lead">修改密码或退出当前账户。</p>
            </header>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>安全</h2>
                </div>
                <div className="tj-menu-list">
                    <button type="button" className="tj-menu-item" onClick={onOpenChangePassword}>
                        <div>
                            <Lock size={18} />
                            <span>修改密码</span>
                        </div>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>登录状态</h2>
                </div>
                <button type="button" className="tj-card tj-account-logout-row" onClick={onLogout}>
                    <span className="tj-account-logout-copy">
                        <LogOut size={18} />
                        退出登录
                    </span>
                    <ChevronRight size={16} />
                </button>
            </section>
        </div>
    );
}
