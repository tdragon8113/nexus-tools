type TimelineActivityLeadingProps = {
    startLabel: string;
    endLabel: string;
    ongoing?: boolean;
};

export default function TimelineActivityLeading({
    startLabel,
    endLabel,
    ongoing = false,
}: TimelineActivityLeadingProps) {
    return (
        <div className="tj-timeline-leading">
            <div className="tj-timeline-time-range">
                <span className="tj-timeline-time-start">{startLabel}</span>
                <span className="tj-timeline-time-sep">–</span>
                <span
                    className={`tj-timeline-time-end${ongoing ? ' tj-timeline-time-live' : ''}`}
                >
                    {endLabel}
                </span>
            </div>
        </div>
    );
}
