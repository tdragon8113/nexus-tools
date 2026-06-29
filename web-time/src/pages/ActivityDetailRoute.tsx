import { useNavigate, useParams } from 'react-router-dom';
import { useTimeJournal } from '../hooks/TimeJournalProvider';
import ActivityDetailPage from './ActivityDetailPage';

export default function ActivityDetailRoute() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { activities, categories, updateActivity } = useTimeJournal();

    const activity = activities.find((item) => item.id === activityId) ?? null;

    return (
        <ActivityDetailPage
            activity={activity}
            categories={categories}
            onBack={() => navigate('/')}
            onUpdateNote={(id, note) => {
                void updateActivity(id, { notes: note });
            }}
        />
    );
}
