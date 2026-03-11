import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatsCard from './StatsCard';
import { TimetableEntry } from '../../utils/types';
import LoadingSpinner from '../common/LoadingSpinner';

export default function FacultyDashboard() {
  const [stats, setStats] = useState<{
    today_classes: TimetableEntry[];
    total_subjects: number;
    total_classes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/faculty-stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Today's Classes" value={stats?.today_classes.length ?? 0} color="blue" />
        <StatsCard title="Total Subjects" value={stats?.total_subjects ?? 0} color="green" />
        <StatsCard title="Total Weekly Classes" value={stats?.total_classes ?? 0} color="purple" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Today's Schedule</h2>
        {stats?.today_classes.length === 0 ? (
          <p className="text-sm text-gray-400">No classes today</p>
        ) : (
          <div className="space-y-2">
            {stats?.today_classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.subject_name}</p>
                  <p className="text-xs text-gray-500">Room: {c.room || 'TBA'}</p>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {c.start_time} - {c.end_time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
