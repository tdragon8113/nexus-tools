import { useNavigate } from 'react-router-dom';
import { formatDateKey } from '../domain/record';
import { buildActiveRecordingSession } from '../domain/recording';
import { useTimeJournal } from '../hooks/TimeJournalProvider';
import HomePage from './HomePage';

export default function HomeRoute() {
    const navigate = useNavigate();
    const {
        activities,
        categories,
        reflections,
        ongoing,
        summary,
        authSession,
        upsertReflection,
    } = useTimeJournal();

    const activeRecording = buildActiveRecordingSession(ongoing);

    return (
        <HomePage
            activities={activities}
            categories={categories}
            reflections={reflections}
            summary={summary}
            activeRecording={activeRecording}
            authSession={authSession}
            onQuickRecord={() => navigate('/record')}
            onOpenRecording={() => navigate('/record')}
            onAddReflection={(content) => {
                void upsertReflection({
                    scope: 'day',
                    periodKey: formatDateKey(new Date()),
                    content,
                });
            }}
            onOpenActivity={(activityId) => navigate(`/activity/${activityId}`)}
            onOpenLogin={() => navigate('/profile')}
        />
    );
}
