import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

type SubpageHeaderProps = {
    title?: string;
    lead?: string;
    onBack: () => void;
    className?: string;
    children?: ReactNode;
};

export default function SubpageHeader({
    title,
    lead,
    onBack,
    className,
    children,
}: SubpageHeaderProps) {
    return (
        <header className={['tj-subpage-sticky-head', className].filter(Boolean).join(' ')}>
            <div className="tj-subpage-head-top">
                <button type="button" className="tj-back-btn" onClick={onBack}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                {title ? <h1 className="tj-subpage-head-title">{title}</h1> : null}
            </div>
            {lead ? <p className="tj-page-lead">{lead}</p> : null}
            {children}
        </header>
    );
}
