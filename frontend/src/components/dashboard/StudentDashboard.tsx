import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatsCard from './StatsCard';
import { TimetableEntry } from '../../utils/types';
import LoadingSpinner from '../common/LoadingSpinner';

export default function StudentDashboard() {
  const [stats, setStats] = useState<{
    attendance_percentage: number;
    total_classes: number;
    present_count: number;
    today_classes: TimetableEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student-stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Attendance"
          value={`${stats?.attendance_percentage ?? 0}%`}
          color={(stats?.attendance_percentage ?? 0) >= 75 ? 'green' : 'red'}
        />
        <StatsCard title="Classes Attended" value={stats?.present_count ?? 0} color="blue" />
        <StatsCard title="Total Classes" value={stats?.total_classes ?? 0} color="purple" />
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
                  <p className="text-xs text-gray-500">
                    {c.faculty_name} &middot; Room: {c.room || 'TBA'}
                  </p>
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
