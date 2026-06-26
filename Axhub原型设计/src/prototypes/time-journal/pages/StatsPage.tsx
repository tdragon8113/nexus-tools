import React, { useState } from 'react';
import { Activity, ActivityCategoryConfig, StatsRangeSelection } from '../data';
import { useStatsViewProps } from './stats/statsShared';
import StatsUnifiedView from './stats/statsUnifiedView';

type StatsPageProps = {
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    onOpenActivity?: (activityId: string) => void;
};

export default function StatsPage({
    activities,
    categories,
    onOpenActivity,
}: StatsPageProps) {
    const [rangeSelection, setRangeSelection] = useState<StatsRangeSelection>({
        preset: 'week',
    });
    const [excludeSleep, setExcludeSleep] = useState(false);

    const viewProps = useStatsViewProps(activities, categories, rangeSelection, excludeSleep);

    return (
        <div className="tj-stats-root">
            <StatsUnifiedView
                {...viewProps}
                setRangeSelection={setRangeSelection}
                setExcludeSleep={setExcludeSleep}
                onOpenActivity={onOpenActivity}
            />
        </div>
    );
}
