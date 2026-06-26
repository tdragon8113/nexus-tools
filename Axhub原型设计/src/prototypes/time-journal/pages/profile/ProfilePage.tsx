import React, { useEffect, useMemo } from 'react';
import { useProtoDevState } from '@axhub/annotation';
import { AuthSession } from '../../auth';
import {
    Activity,
    ActivityCategoryConfig,
    Reflection,
    getLevelInfo,
    getRecordDayCount,
    getStreakDays,
    getTotalXp,
} from '../../data';
import {
    ensureProfileExploreControls,
    resolveProfileVariant,
    type ProfileVariant,
} from './profileExploreControls';
import { renderProfileVariant } from './profileVariants';

type ProfilePageProps = {
    authSession: AuthSession | null;
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    reflections: Reflection[];
    onLogin: (session: AuthSession) => void;
    onLogout: () => void;
    onOpenCategoryManage: () => void;
    onOpenHelp: () => void;
    onOpenRecordDays: () => void;
    onOpenActivitiesList: () => void;
    onOpenReflectionsList: () => void;
    onOpenMonthSummaries: () => void;
    onOpenYearSummaries: () => void;
    onOpenAccountManage: () => void;
};

type ProfileProtoState = {
    profile_variant?: ProfileVariant;
};

export default function ProfilePage({
    authSession,
    activities,
    categories,
    reflections,
    onLogin,
    onLogout,
    onOpenCategoryManage,
    onOpenHelp,
    onOpenRecordDays,
    onOpenActivitiesList,
    onOpenReflectionsList,
    onOpenMonthSummaries,
    onOpenYearSummaries,
    onOpenAccountManage,
}: ProfilePageProps) {
    useEffect(() => {
        ensureProfileExploreControls();
    }, []);

    const protoState = useProtoDevState<ProfileProtoState>();
    const variant = resolveProfileVariant(protoState.profile_variant);

    const viewProps = useMemo(() => {
        const totalXp = getTotalXp(activities);
        return {
            authSession,
            activities,
            categories,
            reflections,
            totalXp,
            levelInfo: getLevelInfo(totalXp),
            streak: getStreakDays(activities, categories),
            recordDays: getRecordDayCount(activities, categories),
            onLogin,
            onOpenCategoryManage,
            onOpenHelp,
            onOpenRecordDays,
            onOpenActivitiesList,
            onOpenReflectionsList,
            onOpenMonthSummaries,
            onOpenYearSummaries,
            onOpenAccountManage,
        };
    }, [
        activities,
        authSession,
        categories,
        onLogin,
        onOpenAccountManage,
        onOpenActivitiesList,
        onOpenCategoryManage,
        onOpenHelp,
        onOpenMonthSummaries,
        onOpenRecordDays,
        onOpenReflectionsList,
        onOpenYearSummaries,
        reflections,
    ]);

    return (
        <div className="tj-profile-root" data-profile-variant={variant}>
            {renderProfileVariant(variant, viewProps)}
        </div>
    );
}
