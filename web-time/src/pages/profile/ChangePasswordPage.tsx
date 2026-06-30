import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubpageHeader from '../../components/SubpageHeader';
import * as authApi from '../../api/auth';
import { ApiError } from '../../api/client';
import { useTimeJournal } from '../../hooks/TimeJournalProvider';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { authSession } = useTimeJournal();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!authSession) {
        return (
            <div className="tj-page tj-subpage">
                <div className="tj-empty-card">请先登录</div>
            </div>
        );
    }

    const { user } = authSession;
    const canSubmit =
        currentPassword.trim() && newPassword.trim() && confirmPassword.trim();

    const handleChangePassword = async () => {
        setIsSubmitting(true);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            setIsSubmitting(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('新密码至少 6 位');
            setIsSubmitting(false);
            return;
        }

        try {
            await authApi.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });
            setError(null);
            setSuccess('密码已更新');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (changeError) {
            setError(
                changeError instanceof ApiError
                    ? changeError.message
                    : '修改密码失败，请稍后重试',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="tj-page tj-subpage">
            <SubpageHeader
                title="修改密码"
                lead={`为账户 ${user.account} 设置新密码。`}
                onBack={() => navigate('/profile/account')}
            />

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
                                        void handleChangePassword();
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
                        onClick={() => void handleChangePassword()}
                    >
                        {isSubmitting ? '保存中…' : '保存新密码'}
                    </button>
                </div>
            </div>
        </div>
    );
}
