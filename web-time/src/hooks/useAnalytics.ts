import { useCallback, useEffect, useState } from 'react';
import * as analyticsApi from '../api/analytics';
import { ApiError } from '../api/client';
import { mapAnalytics } from '../api/mappers';
import type { AnalyticsData, StatsRangeSelection } from '../domain/stats';

type UseAnalyticsParams = {
    rangeSelection: StatsRangeSelection;
    excludeSleep: boolean;
    enabled?: boolean;
};

function toErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return '加载统计失败';
}

export function useAnalytics({
    rangeSelection,
    excludeSleep,
    enabled = true,
}: UseAnalyticsParams) {
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await analyticsApi.getAnalytics({
                preset: rangeSelection.preset,
                customStartKey: rangeSelection.customStartKey,
                customEndKey: rangeSelection.customEndKey,
                excludeSleep,
            });
            setData(mapAnalytics(response));
        } catch (fetchError) {
            setError(toErrorMessage(fetchError));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [enabled, excludeSleep, rangeSelection]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { loading, error, data, refetch };
}
