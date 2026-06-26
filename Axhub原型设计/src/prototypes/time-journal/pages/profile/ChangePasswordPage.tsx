import React, { useState } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { AuthSession, mockChangePassword } from '../../auth';

type ChangePasswordPageProps = {
    authSession: AuthSession;
    onBack: () => void;
};

export default function ChangePasswordPage({ authSession, onBack }: ChangePasswordPageProps) {
    const { user } = authSession;
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit =
        currentPassword.trim() && newPassword.trim() && confirmPassword.trim();

    const handleChangePassword = () => {
        setIsSubmitting(true);
        setSuccess(null);
        const result = mockChangePassword({
            account: user.account,
            currentPassword,
            newPassword,
            confirmPassword,
        });

        if (result !== true) {
            setError(result);
            setIsSubmitting(false);
            return;
        }

        setError(null);
        setSuccess('密码已更新');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsSubmitting(false);
    };

    return (
        <div className="tj-page tj-subpage">
            <header className="tj-subpage-sticky-head">
                <button type="button" className="tj-back-btn" onClick={onBack}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                <h1>修改密码</h1>
                <p className="tj-page-lead">为账户 {user.account} 设置新密码。</p>
            </header>

            <div className="tj-card tj-auth-panel">
                <div className="tj-auth-form">
                    <label className="tj-field">
                        <span className="tj-field-label">当前密码</span>
                        <div className="tj-auth-input-row">
                            <Lock size={18} aria-hidden="true" />
                            <input
                                className="tj-input"
                                type="password"
                                autoComplete="current-password"
                                placeholder="请输入当前密码"
                                value={currentPassword}
                                onChange={(event) => {
                                    setCurrentPassword(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                    if (success) {
                                        setSuccess(null);
                                    }
                                }}
                            />
                        </div>
                    </label>

                    <label className="tj-field">
                        <span className="tj-field-label">新密码</span>
                        <div className="tj-auth-input-row">
                            <Lock size={18} aria-hidden="true" />
                            <input
                                className="tj-input"
                                type="password"
                                autoComplete="new-password"
                                placeholder="至少 6 位"
                                value={newPassword}
                                onChange={(event) => {
                                    setNewPassword(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                    if (success) {
                                        setSuccess(null);
                                    }
                                }}
                            />
                        </div>
                    </label>

                    <label className="tj-field">
                        <span className="tj-field-label">确认新密码</span>
                        <div className="tj-auth-input-row">
                            <Lock size={18} aria-hidden="true" />
                            <input
                                className="tj-input"
                                type="password"
                                autoComplete="new-password"
                                placeholder="请再次输入新密码"
                                value={confirmPassword}
                                onChange={(event) => {
                                    setConfirmPassword(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                    if (success) {
                                        setSuccess(null);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && canSubmit) {
                                        handleChangePassword();
                                    }
                                }}
                            />
                        </div>
                    </label>

                    {error ? <p className="tj-auth-error">{error}</p> : null}
                    {success ? <p className="tj-auth-success">{success}</p> : null}

                    <button
                        type="button"
                        className="tj-primary-btn tj-auth-submit"
                        disabled={isSubmitting || !canSubmit}
                        onClick={handleChangePassword}
                    >
                        {isSubmitting ? '保存中…' : '保存新密码'}
                    </button>
                </div>
            </div>
        </div>
    );
}
