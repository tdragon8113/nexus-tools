/**
 * @name 速达快递官网首页
 */

import React, { useMemo, useState } from 'react';
import {
    ArrowRight,
    Building2,
    Calculator,
    CheckCircle2,
    Clock,
    MapPin,
    Package,
    Search,
    ShieldCheck,
    Store,
    Truck,
    Zap,
} from 'lucide-react';
import './style.css';

type ServiceCard = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tone: 'sage' | 'green' | 'dark';
};

type StatItem = {
    value: string;
    label: string;
};

type ProcessStep = {
    step: string;
    title: string;
    description: string;
};

const navLinks = ['寄件', '查件', '服务', '商家中心'];

const serviceCards: ServiceCard[] = [
    {
        id: 'personal',
        title: '个人寄件',
        description: '上门取件，全国覆盖，退换货也省心',
        icon: <Package size={28} strokeWidth={1.75} />,
        tone: 'green',
    },
    {
        id: 'business',
        title: '商家寄件',
        description: '批量打单、月结对账，电商发货更高效',
        icon: <Store size={28} strokeWidth={1.75} />,
        tone: 'dark',
    },
    {
        id: 'same-day',
        title: '同城急送',
        description: '2 小时达，文件礼品同城闪送',
        icon: <Zap size={28} strokeWidth={1.75} />,
        tone: 'sage',
    },
    {
        id: 'freight',
        title: '大件物流',
        description: '家具家电、批量货物，专线更优惠',
        icon: <Truck size={28} strokeWidth={1.75} />,
        tone: 'sage',
    },
];

const stats: StatItem[] = [
    { value: '300+', label: '覆盖城市' },
    { value: '500 万+', label: '日均单量' },
    { value: '99.2%', label: '准时送达率' },
    { value: '24h', label: '客服响应' },
];

const processSteps: ProcessStep[] = [
    {
        step: '01',
        title: '在线下单',
        description: '填写寄收件信息，选择上门时间',
    },
    {
        step: '02',
        title: '上门取件',
        description: '快递员准时上门，当面核验包裹',
    },
    {
        step: '03',
        title: '运输中转',
        description: '全程可追踪，异常主动通知',
    },
    {
        step: '04',
        title: '签收完成',
        description: '收件人确认签收，电子回单可查',
    },
];

const businessFeatures = [
    {
        title: '批量打单',
        detail: '一次导入百单，自动匹配最优线路',
    },
    {
        title: '月结对账',
        detail: '统一账单、开票便捷，财务更省心',
    },
    {
        title: '电商对接',
        detail: '主流平台一键接入，订单自动同步',
    },
];

function estimateFreight(from: string, to: string, weight: string): string | null {
    if (!from.trim() || !to.trim() || !weight.trim()) {
        return null;
    }

    const parsedWeight = Number.parseFloat(weight);
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
        return null;
    }

    const base = 12;
    const distanceFactor = Math.max(from.length, to.length) * 0.8;
    const weightFactor = parsedWeight * 2.5;
    const total = base + distanceFactor + weightFactor;

    return `¥${total.toFixed(0)} 起`;
}

export default function ExpressHomepage() {
    const [trackingNo, setTrackingNo] = useState('');
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [weight, setWeight] = useState('');
    const [trackingHint, setTrackingHint] = useState<string | null>(null);
    const [freightHint, setFreightHint] = useState<string | null>(null);

    const estimatedPrice = useMemo(
        () => estimateFreight(fromCity, toCity, weight),
        [fromCity, toCity, weight],
    );

    const handleTrack = () => {
        if (!trackingNo.trim()) {
            setTrackingHint('请输入运单号后再查询');
            return;
        }

        setTrackingHint(`运单 ${trackingNo.trim()} 运输中，预计明日 18:00 前送达`);
    };

    const handleEstimate = () => {
        const price = estimateFreight(fromCity, toCity, weight);
        if (!price) {
            setFreightHint('请填写完整的始发地、目的地和重量');
            return;
        }

        setFreightHint(`预估运费 ${price}（标准快递，不含保价）`);
    };

    return (
        <div className="express-homepage">
            <header className="express-header">
                <div className="express-container express-header-inner">
                    <a className="express-brand" href="#top" aria-label="速达快递首页">
                        <span className="express-brand-mark" aria-hidden="true">
                            <Truck size={20} strokeWidth={2.2} />
                        </span>
                        <span className="express-brand-name">速达快递</span>
                    </a>

                    <nav className="express-nav" aria-label="主导航">
                        {navLinks.map((link) => (
                            <a key={link} className="express-nav-link" href={`#${link}`}>
                                {link}
                            </a>
                        ))}
                    </nav>

                    <div className="express-header-actions">
                        <button type="button" className="express-btn express-btn-ghost">
                            登录
                        </button>
                        <button type="button" className="express-btn express-btn-primary">
                            注册
                        </button>
                    </div>
                </div>
            </header>

            <main id="top">
                <section className="express-hero">
                    <div className="express-container express-hero-grid">
                        <div className="express-hero-copy">
                            <p className="express-eyebrow">个人与小商家 · 一个平台搞定</p>
                            <h1 className="express-hero-title">
                                全国寄件，
                                <br />
                                准时必达
                            </h1>
                            <p className="express-hero-lead">
                                上门取件、实时追踪、商家批量发货。无论是一单退换货，还是网店日常发货，速达都能帮你更快送达。
                            </p>

                            <div className="express-hero-badges">
                                <span className="express-badge">
                                    <ShieldCheck size={16} />
                                    丢损必赔
                                </span>
                                <span className="express-badge">
                                    <Clock size={16} />
                                    2 小时上门
                                </span>
                                <span className="express-badge">
                                    <MapPin size={16} />
                                    300+ 城市
                                </span>
                            </div>
                        </div>

                        <div className="express-hero-panel">
                            <div className="express-panel-block" id="查件">
                                <div className="express-panel-head">
                                    <Search size={20} />
                                    <div>
                                        <h2>查快递</h2>
                                        <p>输入运单号，实时查看物流状态</p>
                                    </div>
                                </div>
                                <div className="express-track-row">
                                    <input
                                        className="express-input"
                                        placeholder="请输入运单号"
                                        value={trackingNo}
                                        onChange={(event) => {
                                            setTrackingNo(event.target.value);
                                            setTrackingHint(null);
                                        }}
                                        aria-label="运单号"
                                    />
                                    <button
                                        type="button"
                                        className="express-btn express-btn-primary"
                                        onClick={handleTrack}
                                    >
                                        查询
                                    </button>
                                </div>
                                {trackingHint ? (
                                    <p className="express-panel-hint express-panel-hint-success">{trackingHint}</p>
                                ) : null}
                            </div>

                            <div className="express-panel-block express-panel-block-accent" id="寄件">
                                <div className="express-panel-head">
                                    <Package size={20} />
                                    <div>
                                        <h2>立即寄件</h2>
                                        <p>填写信息，预约上门取件</p>
                                    </div>
                                </div>
                                <button type="button" className="express-btn express-btn-dark express-btn-wide">
                                    开始寄件
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="express-section" id="服务">
                    <div className="express-container">
                        <div className="express-section-head">
                            <h2 className="express-section-title">选择适合你的寄件方式</h2>
                            <p className="express-section-lead">从个人包裹到商家批量发货，按需选择服务类型</p>
                        </div>

                        <div className="express-service-grid">
                            {serviceCards.map((card) => (
                                <article
                                    key={card.id}
                                    className={`express-service-card express-service-card-${card.tone}`}
                                >
                                    <div className="express-service-icon">{card.icon}</div>
                                    <h3>{card.title}</h3>
                                    <p>{card.description}</p>
                                    <button type="button" className="express-link-btn">
                                        了解详情
                                        <ArrowRight size={16} />
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="express-section express-section-soft">
                    <div className="express-container">
                        <div className="express-calculator">
                            <div className="express-calculator-copy">
                                <div className="express-calculator-icon">
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h2 className="express-section-title">运费试算</h2>
                                    <p className="express-section-lead">
                                        填写线路与重量，快速获得预估价格（示例数据）
                                    </p>
                                </div>
                            </div>

                            <div className="express-calculator-form">
                                <label className="express-field">
                                    <span>始发地</span>
                                    <input
                                        className="express-input"
                                        placeholder="如：上海"
                                        value={fromCity}
                                        onChange={(event) => {
                                            setFromCity(event.target.value);
                                            setFreightHint(null);
                                        }}
                                    />
                                </label>
                                <label className="express-field">
                                    <span>目的地</span>
                                    <input
                                        className="express-input"
                                        placeholder="如：北京"
                                        value={toCity}
                                        onChange={(event) => {
                                            setToCity(event.target.value);
                                            setFreightHint(null);
                                        }}
                                    />
                                </label>
                                <label className="express-field">
                                    <span>重量 (kg)</span>
                                    <input
                                        className="express-input"
                                        placeholder="如：2"
                                        inputMode="decimal"
                                        value={weight}
                                        onChange={(event) => {
                                            setWeight(event.target.value);
                                            setFreightHint(null);
                                        }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="express-btn express-btn-primary express-btn-wide"
                                    onClick={handleEstimate}
                                >
                                    估算运费
                                </button>
                            </div>

                            {freightHint ? (
                                <p className="express-calculator-result">{freightHint}</p>
                            ) : estimatedPrice ? (
                                <p className="express-calculator-result express-calculator-result-muted">
                                    填写完整信息后可查看预估：{estimatedPrice}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="express-section express-business-band" id="商家中心">
                    <div className="express-container express-business-grid">
                        <div className="express-business-copy">
                            <p className="express-eyebrow express-eyebrow-light">小商家专区</p>
                            <h2 className="express-section-title express-section-title-light">
                                网店发货，
                                <br />
                                批量更省心
                            </h2>
                            <p className="express-section-lead express-section-lead-light">
                                为中小电商、社群团购和线下门店提供稳定时效与对账能力，让发货从成本中心变成竞争优势。
                            </p>
                            <button type="button" className="express-btn express-btn-primary">
                                开通商家寄件
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="express-business-features">
                            {businessFeatures.map((feature) => (
                                <article key={feature.title} className="express-business-card">
                                    <div className="express-business-card-icon">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.detail}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="express-section">
                    <div className="express-container">
                        <div className="express-stats-grid">
                            {stats.map((item) => (
                                <div key={item.label} className="express-stat-card">
                                    <strong>{item.value}</strong>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="express-section express-section-soft">
                    <div className="express-container">
                        <div className="express-section-head">
                            <h2 className="express-section-title">四步完成寄件</h2>
                            <p className="express-section-lead">流程清晰，首次使用也能快速上手</p>
                        </div>

                        <ol className="express-process-grid">
                            {processSteps.map((step) => (
                                <li key={step.step} className="express-process-card">
                                    <span className="express-process-step">{step.step}</span>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section className="express-cta-band">
                    <div className="express-container express-cta-inner">
                        <div>
                            <h2>准备好寄出第一单了吗？</h2>
                            <p>新用户首单立减 5 元，商家开通享 7 天免月结服务费</p>
                        </div>
                        <div className="express-cta-actions">
                            <button type="button" className="express-btn express-btn-primary">
                                立即寄件
                            </button>
                            <button type="button" className="express-btn express-btn-secondary">
                                联系商务
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="express-footer">
                <div className="express-container express-footer-grid">
                    <div className="express-footer-brand">
                        <span className="express-brand-mark" aria-hidden="true">
                            <Truck size={18} />
                        </span>
                        <strong>速达快递</strong>
                        <p>让每一次寄送都更可靠</p>
                    </div>

                    <div className="express-footer-links">
                        <div>
                            <h4>帮助中心</h4>
                            <a href="#help">寄件指南</a>
                            <a href="#help">理赔说明</a>
                            <a href="#help">常见问题</a>
                        </div>
                        <div>
                            <h4>服务支持</h4>
                            <a href="#network">网点查询</a>
                            <a href="#contact">联系我们</a>
                            <a href="#business">商家合作</a>
                        </div>
                        <div>
                            <h4>合规信息</h4>
                            <span>客服热线 95338</span>
                            <span>沪 ICP 备 20260625 号</span>
                        </div>
                    </div>
                </div>

                <div className="express-footer-bottom">
                    <div className="express-container">
                        <span>© 2026 速达快递 版权所有</span>
                        <span className="express-footer-note">
                            <CheckCircle2 size={14} />
                            本页为产品原型，数据均为示例
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
