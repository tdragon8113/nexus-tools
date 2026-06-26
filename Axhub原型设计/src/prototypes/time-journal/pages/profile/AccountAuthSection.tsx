import React, { useState } from 'react';
import { Lock, UserRound } from 'lucide-react';
import {
    AuthSession,
    demoLoginAccount,
    demoLoginPassword,
    mockLoginWithPassword,
    mockRegisterAccount,
} from '../../auth';

type AccountAuthSectionProps = {
    onLogin: (session: AuthSession) => void;
};

type AuthMode = 'login' | 'register';

export default function AccountAuthSection({ onLogin }: AccountAuthSectionProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [displayName, setDisplayName] = useState('');
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setDisplayName('');
        setAccount('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    };

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        resetForm();
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        const result =
            mode === 'login'
                ? mockLoginWithPassword(account, password)
                : mockRegisterAccount({
                      account,
                      password,
                      confirmPassword,
                      displayName,
                  });

        if (typeof result === 'string') {
            setError(result);
            setIsSubmitting(false);
            return;
        }

        onLogin(result);
        resetForm();
        setMode('login');
        setIsSubmitting(false);
    };

    const canSubmit =
        account.trim() &&
        password.trim() &&
        (mode === 'login' || confirmPassword.trim());

    return (
        <div className="tj-auth-panel">
                <div className="tj-auth-tabs" role="tablist" aria-label="账户操作">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={`tj-auth-tab${mode === 'login' ? ' tj-auth-tab-active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        登录
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'register'}
                        className={`tj-auth-tab${mode === 'register' ? ' tj-auth-tab-active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        注册
                    </button>
                </div>

                <div className="tj-auth-form">
                    {mode === 'register' ? (
                        <label className="tj-field">
                            <span className="tj-field-label">昵称（可选）</span>
                            <div className="tj-auth-input-row">
                                <UserRound size={18} aria-hidden="true" />
                                <input
                                    className="tj-input"
                                    type="text"
                                    autoComplete="nickname"
                                    placeholder="用于展示的名称"
                                    value={displayName}
                                    maxLength={12}
                                    onChange={(event) => {
                                        setDisplayName(event.target.value);
                                        if (error) {
                                            setError(null);
                                        }
                                    }}
                                />
                            </div>
                        </label>
                    ) : null}

                    <label className="tj-field">
                        <span className="tj-field-label">账户</span>
                        <div className="tj-auth-input-row">
                            <UserRound size={18} aria-hidden="true" />
                            <input
                                className="tj-input"
                                type="text"
                                autoComplete={mode === 'login' ? 'username' : 'off'}
                                placeholder="请输入账户名"
                                value={account}
                                maxLength={20}
                                onChange={(event) => {
                                    setAccount(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                            />
                        </div>
                    </label>

                    <label className="tj-field">
                        <span className="tj-field-label">密码</span>
                        <div className="tj-auth-input-row">
                            <Lock size={18} aria-hidden="true" />
                            <input
                                className="tj-input"
                                type="password"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                placeholder="请输入密码"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && canSubmit) {
                                        handleSubmit();
                                    }
                                }}
                            />
                        </div>
                    </label>

                    {mode === 'register' ? (
                        <label className="tj-field">
                            <span className="tj-field-label">确认密码</span>
                            <div className="tj-auth-input-row">
                                <Lock size={18} aria-hidden="true" />
                                <input
                                    className="tj-input"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="请再次输入密码"
                                    value={confirmPassword}
                                    onChange={(event) => {
                                        setConfirmPassword(event.target.value);
                                        if (error) {
                                            setError(null);
                                        }
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && canSubmit) {
                                            handleSubmit();
                                        }
                                    }}
                                />
                            </div>
                        </label>
                    ) : null}

                    {error ? <p className="tj-auth-error">{error}</p> : null}

                    <button
                        type="button"
                        className="tj-primary-btn tj-auth-submit"
                        disabled={isSubmitting || !canSubmit}
                        onClick={handleSubmit}
                    >
                        {isSubmitting
                            ? mode === 'login'
                                ? '登录中…'
                                : '注册中…'
                            : mode === 'login'
                              ? '登录'
                              : '注册并登录'}
                    </button>
                </div>

                <p className="tj-auth-hint">
                    {mode === 'login'
                        ? `演示账户 ${demoLoginAccount} / ${demoLoginPassword}；其他账户需先注册`
                        : '注册成功后将自动登录，同一账户可在其他设备继续同步（后续接入后端）'}
                </p>
        </div>
    );
}
