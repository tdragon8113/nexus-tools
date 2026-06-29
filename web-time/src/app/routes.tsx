import type { RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import StatsPage from '../pages/StatsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import CategoryManagePage from '../pages/profile/CategoryManagePage';
import HelpPage from '../pages/profile/HelpPage';
import AccountManagePage from '../pages/profile/AccountManagePage';
import ChangePasswordPage from '../pages/profile/ChangePasswordPage';
import ProfileArchivePage from '../pages/profile/ProfileArchivePage';

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { index: true, element: null },
            { path: 'record', element: null },
            { path: 'stats', element: <StatsPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'profile/categories', element: <CategoryManagePage /> },
            { path: 'profile/help', element: <HelpPage /> },
            { path: 'profile/account', element: <AccountManagePage /> },
            { path: 'profile/change-password', element: <ChangePasswordPage /> },
            { path: 'profile/record-days', element: <ProfileArchivePage kind="record-days" /> },
            { path: 'profile/activities', element: <ProfileArchivePage kind="activities" /> },
            { path: 'profile/reflections', element: <ProfileArchivePage kind="reflections" /> },
            {
                path: 'profile/month-summaries',
                element: <ProfileArchivePage kind="month-summaries" />,
            },
            {
                path: 'profile/year-summaries',
                element: <ProfileArchivePage kind="year-summaries" />,
            },
            { path: 'activity/:activityId', element: null },
        ],
    },
];
